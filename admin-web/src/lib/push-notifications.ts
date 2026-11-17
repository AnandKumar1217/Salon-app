/**
 * Glamora Central Push Notification Service
 * Architecture: Managed Expo Push HTTP/2 Gateway (APNs for iOS, FCM v1 for Android)
 * Zero Firebase client SDKs, zero Firestore, zero Firebase Cloud Functions.
 */

import { getDatabase } from './mongodb';
import { COLLECTIONS } from './mongodb-service';
import { Booking } from './types';

export interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

const EXPO_PUSH_API_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/**
 * Validates whether a token string is a valid Expo Push Token
 */
export function isExpoPushToken(token: any): boolean {
  if (typeof token !== 'string') return false;
  return /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(token.trim());
}

/**
 * Dispatches one or multiple push messages to the official Expo Push HTTP Gateway.
 * Batches messages into chunks of 100 per Expo API specification.
 */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage | ExpoPushMessage[]
): Promise<{ success: boolean; deliveredCount: number; errors: any[] }> {
  const msgList = Array.isArray(messages) ? messages : [messages];

  // Flatten and validate recipients
  const validMessages: Array<ExpoPushMessage & { to: string }> = [];
  for (const m of msgList) {
    const recipients = Array.isArray(m.to) ? m.to : [m.to];
    for (const token of recipients) {
      if (isExpoPushToken(token)) {
        validMessages.push({
          ...m,
          to: token,
          sound: m.sound === undefined ? 'default' : m.sound,
          channelId: m.channelId || 'glamora-default',
        });
      }
    }
  }

  if (validMessages.length === 0) {
    return { success: true, deliveredCount: 0, errors: [] };
  }

  const errors: any[] = [];
  let deliveredCount = 0;
  const CHUNK_SIZE = 100;

  for (let i = 0; i < validMessages.length; i += CHUNK_SIZE) {
    const chunk = validMessages.slice(i, i + CHUNK_SIZE);
    try {
      const response = await fetch(EXPO_PUSH_API_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const errorText = await response.text();
        errors.push({ status: response.status, error: errorText });
        continue;
      }

      const result = await response.json();
      const tickets: ExpoPushTicket[] = result.data || [];

      for (let idx = 0; idx < tickets.length; idx++) {
        const ticket = tickets[idx];
        if (ticket.status === 'ok') {
          deliveredCount++;
        } else {
          errors.push({
            token: chunk[idx]?.to,
            error: ticket.message || ticket.details?.error || 'Unknown error',
          });
        }
      }
    } catch (err: any) {
      console.warn('[Push Notification Service] Network or Gateway dispatch error:', err.message);
      errors.push({ error: err.message });
    }
  }

  return {
    success: deliveredCount > 0 || errors.length === 0,
    deliveredCount,
    errors,
  };
}

/**
 * Persists an in-app notification in MongoDB Atlas and dispatches push notification if tokens exist.
 */
export async function notifyUser(
  userId: string,
  notification: {
    title: string;
    body: string;
    type?: string;
    bookingId?: string;
    data?: Record<string, any>;
  }
): Promise<void> {
  try {
    const db = await getDatabase();

    // 1. Record in-app notification
    const inAppRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: notification.title,
      message: notification.body,
      type: notification.type || 'SYSTEM',
      bookingId: notification.bookingId,
      data: notification.data || {},
      read: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await db.collection('notifications').insertOne(inAppRecord);
    } catch (e) {
      // In case collection or DB is temporarily unreachable in testing
    }

    // 2. Lookup push tokens
    const userDoc = await db.collection(COLLECTIONS.USERS).findOne({
      $or: [{ id: userId }, { _id: (userId as any) }, { email: userId }, { phone: userId }],
    });

    const tokens: string[] = [];
    if (userDoc?.pushToken && isExpoPushToken(userDoc.pushToken)) {
      tokens.push(userDoc.pushToken);
    }
    if (Array.isArray(userDoc?.pushTokens)) {
      for (const t of userDoc.pushTokens) {
        if (isExpoPushToken(t) && !tokens.includes(t)) {
          tokens.push(t);
        }
      }
    }

    // Also check dedicated push_tokens collection
    const extraTokens = await db.collection('push_tokens').find({ userId }).toArray();
    for (const t of extraTokens) {
      if (t.token && isExpoPushToken(t.token) && !tokens.includes(t.token)) {
        tokens.push(t.token);
      }
    }

    if (tokens.length > 0) {
      await sendExpoPushNotifications({
        to: tokens,
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          bookingId: notification.bookingId,
          type: notification.type,
        },
      });
    }
  } catch (err: any) {
    console.warn(`[Push Service] Could not notify user ${userId}:`, err.message);
  }
}

/**
 * Looks up the salon owner and dispatches push notifications
 */
export async function notifySalonOwner(
  salonId: string,
  notification: {
    title: string;
    body: string;
    type?: string;
    bookingId?: string;
    data?: Record<string, any>;
  }
): Promise<void> {
  try {
    const db = await getDatabase();
    const salon = await db.collection(COLLECTIONS.SALONS).findOne({
      $or: [{ id: salonId }, { _id: (salonId as any) }],
    });

    if (salon && salon.ownerId) {
      await notifyUser(salon.ownerId, notification);
    }
  } catch (err: any) {
    console.warn(`[Push Service] Could not notify salon owner for salon ${salonId}:`, err.message);
  }
}

/**
 * Triggers push notifications on appointment creation (to both customer and salon owner)
 */
export async function notifyBookingCreated(booking: Booking): Promise<void> {
  const serviceList = booking.services.map((s) => s.name).join(', ');

  // Customer push notification
  if (booking.customerId) {
    await notifyUser(booking.customerId, {
      title: 'Booking Confirmed! ✨',
      body: `Your appointment at ${booking.salonName} for ${serviceList} is scheduled for ${booking.date} at ${booking.startTime}.`,
      type: 'BOOKING_CONFIRMED',
      bookingId: booking.id,
      data: { salonId: booking.salonId, date: booking.date, time: booking.startTime },
    });
  }

  // Salon Owner push notification
  await notifySalonOwner(booking.salonId, {
    title: 'New Appointment Booked 📅',
    body: `${booking.customerName} booked ${serviceList} on ${booking.date} at ${booking.startTime}.`,
    type: 'NEW_BOOKING',
    bookingId: booking.id,
    data: { salonId: booking.salonId, customerPhone: booking.customerPhone },
  });
}

/**
 * Triggers push notifications on appointment status transitions
 */
export async function notifyBookingStatusUpdated(
  booking: Booking,
  status: string,
  delayMinutes?: number
): Promise<void> {
  switch (status) {
    case 'COMPLETED':
      if (booking.customerId) {
        await notifyUser(booking.customerId, {
          title: 'Appointment Completed 🎉',
          body: `Thank you for visiting ${booking.salonName}! How was your service with ${booking.staffName}?`,
          type: 'COMPLETED',
          bookingId: booking.id,
        });
      }
      break;

    case 'CANCELLED':
      if (booking.customerId) {
        await notifyUser(booking.customerId, {
          title: 'Booking Cancelled ❌',
          body: `Your appointment at ${booking.salonName} for ${booking.date} has been cancelled.`,
          type: 'CANCELLED',
          bookingId: booking.id,
        });
      }
      await notifySalonOwner(booking.salonId, {
        title: 'Booking Cancelled ❌',
        body: `Booking #${booking.bookingCode || booking.id} for ${booking.customerName} has been cancelled.`,
        type: 'CANCELLED',
        bookingId: booking.id,
      });
      break;

    case 'DELAYED':
      if (booking.customerId) {
        await notifyUser(booking.customerId, {
          title: 'Appointment Schedule Update ⏳',
          body: `Your appointment at ${booking.salonName} is delayed${delayMinutes ? ` by ~${delayMinutes} mins` : ''}. We apologize for the wait!`,
          type: 'DELAY',
          bookingId: booking.id,
        });
      }
      break;

    case 'CONFIRMED':
      if (booking.customerId) {
        await notifyUser(booking.customerId, {
          title: 'Appointment Confirmed! 💇',
          body: `${booking.salonName} confirmed your upcoming visit for ${booking.date} at ${booking.startTime}.`,
          type: 'BOOKING_CONFIRMED',
          bookingId: booking.id,
        });
      }
      break;
  }
}

/**
 * Triggers push notifications on salon onboarding approval/rejection decisions
 */
export async function notifySalonApplicationDecision(
  ownerId: string,
  salonName: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<void> {
  if (status === 'APPROVED') {
    await notifyUser(ownerId, {
      title: 'Salon Application Approved! 🎊',
      body: `Congratulations! Your salon "${salonName}" has been approved and is now live on Glamora.`,
      type: 'SALON_APPLICATION_APPROVED',
      data: { salonName, status: 'APPROVED' },
    });
  } else {
    await notifyUser(ownerId, {
      title: 'Salon Application Update 📋',
      body: `Your salon application for "${salonName}" was not approved${reason ? `: ${reason}` : '.'}`,
      type: 'SALON_APPLICATION_REJECTED',
      data: { salonName, status: 'REJECTED', reason },
    });
  }
}

/**
 * Triggers push notifications on activity approval request decisions
 */
export async function notifyActivityRequestDecision(
  ownerId: string,
  salonName: string,
  requestTitle: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<void> {
  if (status === 'APPROVED') {
    await notifyUser(ownerId, {
      title: 'Activity Request Approved! ✅',
      body: `Your request "${requestTitle}" for ${salonName} has been approved.`,
      type: 'ACTIVITY_REQUEST_APPROVED',
      data: { salonName, requestTitle, status: 'APPROVED' },
    });
  } else {
    await notifyUser(ownerId, {
      title: 'Activity Request Declined ❌',
      body: `Your request "${requestTitle}" for ${salonName} was rejected${reason ? `: ${reason}` : '.'}`,
      type: 'ACTIVITY_REQUEST_REJECTED',
      data: { salonName, requestTitle, status: 'REJECTED', reason },
    });
  }
}

