import { getDatabase } from './mongodb';
import {
  Salon,
  OwnerApplication,
  CustomerUser,
  SalonOwnerUser,
  Booking,
  PaymentTransaction,
  PlatformSubscription,
  SupportTicket,
  AdminAuditLog,
  AdminUser,
  SalonStatus,
  ActivityRequest,
  ActivityRequestStatus,
} from './types';

// Collection Names
export const COLLECTIONS = {
  SALONS: 'salons',
  OWNER_APPLICATIONS: 'owner_applications',
  BOOKINGS: 'bookings',
  USERS: 'users',
  ADMIN_AUDIT_LOGS: 'admin_audit_logs',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
  SUPPORT_TICKETS: 'support_tickets',
  ADMIN_USERS: 'admin_users',
  ACTIVITY_REQUESTS: 'activity_requests',
} as const;

let indexesEnsured = false;

/**
 * Ensures authoritative production indexes and unique constraints on MongoDB
 */
export async function ensureMongoIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const db = await getDatabase();

    // 1. admin_users
    await db.collection(COLLECTIONS.ADMIN_USERS).createIndex({ email: 1 }, { unique: true });

    // 2. users
    await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection(COLLECTIONS.USERS).createIndex({ phone: 1 }, { unique: true, sparse: true });

    // 3. salons
    await db.collection(COLLECTIONS.SALONS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.SALONS).createIndex({ status: 1 });
    await db.collection(COLLECTIONS.SALONS).createIndex({ ownerId: 1 });
    await db.collection(COLLECTIONS.SALONS).createIndex({ city: 1 });

    // 4. bookings - composite index for zero-overbooking verification
    await db.collection(COLLECTIONS.BOOKINGS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.BOOKINGS).createIndex({ bookingCode: 1 }, { unique: true, sparse: true });
    await db.collection(COLLECTIONS.BOOKINGS).createIndex({ salonId: 1, date: 1, staffId: 1, status: 1 });
    await db.collection(COLLECTIONS.BOOKINGS).createIndex({ customerId: 1 });

    // 5. owner_applications
    await db.collection(COLLECTIONS.OWNER_APPLICATIONS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.OWNER_APPLICATIONS).createIndex({ status: 1 });
    await db.collection(COLLECTIONS.OWNER_APPLICATIONS).createIndex({ ownerPhone: 1 });

    // 6. admin_audit_logs
    await db.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).createIndex({ timestamp: -1 });
    await db.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).createIndex({ actorId: 1 });
    await db.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).createIndex({ targetCollection: 1 });

    // 7. subscriptions
    await db.collection(COLLECTIONS.SUBSCRIPTIONS).createIndex({ salonId: 1 });

    // 8. payments
    await db.collection(COLLECTIONS.PAYMENTS).createIndex({ transactionId: 1 }, { unique: true, sparse: true });
    await db.collection(COLLECTIONS.PAYMENTS).createIndex({ bookingId: 1 });

    indexesEnsured = true;
  } catch (err) {
    console.warn('[MongoDB] Index creation notice (deferred if cluster offline during build):', err);
  }
}

// -------------------------------------------------------------
// Salons
// -------------------------------------------------------------
export async function getMongoSalons(): Promise<Salon[]> {
  try {
    const db = await getDatabase();
    const docs = await db.collection(COLLECTIONS.SALONS).find({}).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as Salon;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoSalons error:', err);
    return [];
  }
}

export async function getMongoSalonById(id: string): Promise<Salon | null> {
  try {
    const db = await getDatabase();
    const doc = await db.collection(COLLECTIONS.SALONS).findOne({ $or: [{ id }, { _id: id as any }] });
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: rest.id || _id.toString(), ...rest } as Salon;
  } catch (err) {
    console.error('[MongoDB] getMongoSalonById error:', err);
    return null;
  }
}

export async function upsertMongoSalon(salon: Partial<Salon> & { id: string }): Promise<void> {
  const db = await getDatabase();
  await db.collection(COLLECTIONS.SALONS).updateOne(
    { id: salon.id },
    { $set: { ...salon, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function updateMongoSalonStatus(
  salonId: string,
  status: SalonStatus,
  reason?: string,
  isPaused?: boolean
): Promise<void> {
  const db = await getDatabase();
  const updateFields: any = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (reason !== undefined) updateFields.suspensionReason = reason;
  if (isPaused !== undefined) updateFields.isOnlineBookingPaused = isPaused;
  if (status === 'APPROVED') {
    updateFields.isOnlineBookingPaused = false;
  }

  await db.collection(COLLECTIONS.SALONS).updateOne(
    { $or: [{ id: salonId }, { _id: salonId as any }] },
    { $set: updateFields }
  );
}

// -------------------------------------------------------------
// Owner Applications
// -------------------------------------------------------------
export async function getMongoOwnerApplications(): Promise<OwnerApplication[]> {
  try {
    const db = await getDatabase();
    const docs = await db.collection(COLLECTIONS.OWNER_APPLICATIONS).find({}).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as OwnerApplication;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoOwnerApplications error:', err);
    return [];
  }
}

export async function insertMongoOwnerApplication(app: Partial<OwnerApplication>): Promise<OwnerApplication> {
  const db = await getDatabase();
  const newApp: OwnerApplication = {
    id: app.id || `app_${Date.now()}`,
    ownerId: app.ownerId || `usr_${Date.now()}`,
    ownerName: app.ownerName || '',
    ownerEmail: app.ownerEmail || '',
    ownerPhone: app.ownerPhone || '',
    salonName: app.salonName || '',
    salonAddress: app.salonAddress || '',
    city: app.city || 'Bengaluru',
    postalCode: app.postalCode || '560001',
    salonContact: app.salonContact || app.ownerPhone || '',
    salonCategory: app.salonCategory || 'Hair & Beauty',
    businessDescription: app.businessDescription || '',
    status: 'PENDING_APPROVAL',
    submittedAt: app.submittedAt || new Date().toISOString(),
    ...app,
  };

  await db.collection(COLLECTIONS.OWNER_APPLICATIONS).insertOne(newApp as any);
  return newApp;
}

export async function updateMongoApplicationStatus(
  appId: string,
  status: SalonStatus,
  reviewedBy?: string,
  rejectionReason?: string
): Promise<OwnerApplication | null> {
  const db = await getDatabase();
  const updateFields: any = {
    status,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (reviewedBy) updateFields.reviewedBy = reviewedBy;
  if (rejectionReason) updateFields.rejectionReason = rejectionReason;

  await db.collection(COLLECTIONS.OWNER_APPLICATIONS).updateOne(
    { $or: [{ id: appId }, { _id: appId as any }] },
    { $set: updateFields }
  );

  const doc = await db.collection(COLLECTIONS.OWNER_APPLICATIONS).findOne({
    $or: [{ id: appId }, { _id: appId as any }],
  });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: rest.id || _id.toString(), ...rest } as OwnerApplication;
}

// -------------------------------------------------------------
// Bookings
// -------------------------------------------------------------
export async function getMongoBookings(filters?: { salonId?: string; customerId?: string }): Promise<Booking[]> {
  try {
    const db = await getDatabase();
    const query: any = {};
    if (filters?.salonId) query.salonId = filters.salonId;
    if (filters?.customerId) query.customerId = filters.customerId;

    const docs = await db.collection(COLLECTIONS.BOOKINGS).find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as Booking;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoBookings error:', err);
    return [];
  }
}

export async function getMongoBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const db = await getDatabase();
    const doc = await db.collection(COLLECTIONS.BOOKINGS).findOne({
      $or: [{ id: bookingId }, { _id: bookingId as any }],
    });
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: rest.id || _id.toString(), ...rest } as Booking;
  } catch (err) {
    console.error('[MongoDB] getMongoBookingById error:', err);
    return null;
  }
}

export async function insertMongoBooking(booking: Partial<Booking>): Promise<Booking> {
  const db = await getDatabase();
  const randomCode = Math.floor(10000 + Math.random() * 90000);
  const nowIso = new Date().toISOString();

  const newBooking: Booking = {
    id: booking.id || `bk_${Date.now()}`,
    bookingCode: booking.bookingCode || `GLM-${randomCode}`,
    salonId: booking.salonId || '',
    salonName: booking.salonName || '',
    salonAddress: booking.salonAddress || '',
    salonPhone: booking.salonPhone || '',
    salonWhatsapp: booking.salonWhatsapp || '',
    salonImage: booking.salonImage || '',
    customerId: booking.customerId || `cust_${Date.now()}`,
    customerName: booking.customerName || 'Customer',
    customerPhone: booking.customerPhone || '',
    customerEmail: booking.customerEmail || '',
    staffId: booking.staffId || 'stf_1',
    staffName: booking.staffName || 'Specialist',
    services: booking.services || [],
    totalDurationMinutes: booking.totalDurationMinutes || 45,
    bufferMinutes: booking.bufferMinutes || 10,
    date: booking.date || nowIso.split('T')[0],
    startTime: booking.startTime || '10:00',
    endTime: booking.endTime || '10:45',
    status: booking.status || 'CONFIRMED',
    paymentStatus: booking.paymentStatus || 'PENDING',
    paymentMethod: booking.paymentMethod || 'PAY_AT_SALON',
    subtotal: booking.subtotal || 0,
    tax: booking.tax || 0,
    totalAmount: booking.totalAmount || 0,
    source: booking.source || 'APP',
    notes: booking.notes || '',
    createdAt: nowIso,
    updatedAt: nowIso,
    ...booking,
  };

  await db.collection(COLLECTIONS.BOOKINGS).insertOne(newBooking as any);
  return newBooking;
}

export async function updateMongoBookingStatus(
  bookingId: string,
  status: Booking['status'],
  delayMinutes?: number,
  cancellationReason?: string
): Promise<void> {
  const db = await getDatabase();
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (delayMinutes !== undefined) {
    updateData.delayMinutes = delayMinutes;
  }
  if (cancellationReason) {
    updateData.cancellationReason = cancellationReason;
    updateData.cancelledAt = new Date().toISOString();
  }
  if (status === 'IN_PROGRESS') {
    updateData.serviceStartedAt = new Date().toISOString();
  }
  if (status === 'COMPLETED') {
    updateData.serviceCompletedAt = new Date().toISOString();
    updateData.paymentStatus = 'PAID';
  }

  await db.collection(COLLECTIONS.BOOKINGS).updateOne(
    { $or: [{ id: bookingId }, { _id: bookingId as any }] },
    { $set: updateData }
  );
}

// -------------------------------------------------------------
// Audit Logs
// -------------------------------------------------------------
export async function insertMongoAuditLog(log: AdminAuditLog): Promise<void> {
  try {
    const db = await getDatabase();
    await db.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).insertOne(log as any);
  } catch (err) {
    console.error('[MongoDB] insertMongoAuditLog error:', err);
  }
}

export async function getMongoAuditLogs(): Promise<AdminAuditLog[]> {
  try {
    const db = await getDatabase();
    const docs = await db.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).find({}).sort({ timestamp: -1 }).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as AdminAuditLog;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoAuditLogs error:', err);
    return [];
  }
}

// -------------------------------------------------------------
// Subscriptions & Payments
// -------------------------------------------------------------
export async function getMongoSubscriptions(): Promise<PlatformSubscription[]> {
  try {
    const db = await getDatabase();
    const docs = await db.collection(COLLECTIONS.SUBSCRIPTIONS).find({}).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as PlatformSubscription;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoSubscriptions error:', err);
    return [];
  }
}

export async function getMongoPayments(): Promise<PaymentTransaction[]> {
  try {
    const db = await getDatabase();
    const docs = await db.collection(COLLECTIONS.PAYMENTS).find({}).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as PaymentTransaction;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoPayments error:', err);
    return [];
  }
}

// -------------------------------------------------------------
// Support Tickets & Admin Users
// -------------------------------------------------------------
export async function getMongoTickets(): Promise<SupportTicket[]> {
  try {
    const db = await getDatabase();
    const docs = await db.collection(COLLECTIONS.SUPPORT_TICKETS).find({}).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as SupportTicket;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoTickets error:', err);
    return [];
  }
}

export async function getMongoAdminUsers(): Promise<AdminUser[]> {
  try {
    const db = await getDatabase();
    const docs = await db.collection(COLLECTIONS.ADMIN_USERS).find({}).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as AdminUser;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoAdminUsers error:', err);
    return [];
  }
}

export async function insertMongoAdminUser(admin: AdminUser): Promise<AdminUser> {
  const db = await getDatabase();
  await db.collection(COLLECTIONS.ADMIN_USERS).insertOne(admin as any);
  return admin;
}

// -------------------------------------------------------------
// Salon Activity Approval Requests
// -------------------------------------------------------------
export async function getMongoActivityRequests(filters?: {
  salonId?: string;
  status?: ActivityRequestStatus;
}): Promise<ActivityRequest[]> {
  try {
    const db = await getDatabase();
    const query: Record<string, any> = {};
    if (filters?.salonId) query.salonId = filters.salonId;
    if (filters?.status) query.status = filters.status;

    const docs = await db.collection(COLLECTIONS.ACTIVITY_REQUESTS).find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: rest.id || _id.toString(), ...rest } as ActivityRequest;
    });
  } catch (err) {
    console.error('[MongoDB] getMongoActivityRequests error:', err);
    return [];
  }
}

export async function insertMongoActivityRequest(
  req: Partial<ActivityRequest>
): Promise<ActivityRequest> {
  const newReq: ActivityRequest = {
    id: req.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    salonId: req.salonId || '',
    salonName: req.salonName || '',
    ownerId: req.ownerId || '',
    ownerName: req.ownerName || '',
    ownerEmail: req.ownerEmail || '',
    requestType: req.requestType || 'BRANCH_EXPANSION',
    title: req.title || 'Activity Request',
    description: req.description || '',
    status: req.status || 'PENDING',
    documents: req.documents || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = await getDatabase();
  await db.collection(COLLECTIONS.ACTIVITY_REQUESTS).insertOne(newReq as any);
  return newReq;
}

export async function updateMongoActivityRequestStatus(
  id: string,
  status: ActivityRequestStatus,
  reviewedBy?: string,
  rejectionReason?: string
): Promise<ActivityRequest | null> {
  const db = await getDatabase();
  const updateData: Record<string, any> = {
    status,
    reviewedBy: reviewedBy || 'admin',
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  const result = await db.collection(COLLECTIONS.ACTIVITY_REQUESTS).findOneAndUpdate(
    { $or: [{ id }, { _id: (id as any) }] },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) return null;
  const { _id, ...rest } = result as any;
  return { id: rest.id || _id.toString(), ...rest } as ActivityRequest;
}
