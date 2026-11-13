export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN';

export type SalonStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type BookingStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type BookingSource = 'APP' | 'WHATSAPP' | 'WALK_IN' | 'WEB';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export type PaymentMethod = 'ONLINE' | 'PAY_AT_SALON';

export type SubscriptionPlanId = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Salon {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  coverImage: string;
  images: string[];
  rating: number;
  reviewCount: number;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  whatsappNumber: string;
  status: SalonStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  operatingHours: Record<string, { open: string; close: string; isOpen: boolean }>;
  bufferMinutes: number;
  cancellationWindowHours: number;
  categories: string[];
  isOnlineBookingPaused?: boolean;
  createdAt: string;
  updatedAt: string;
  totalBookingsCount?: number;
  totalRevenue?: number;
}

export interface OwnerApplication {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  salonName: string;
  salonAddress: string;
  city: string;
  postalCode: string;
  salonContact: string;
  salonCategory: string;
  businessDescription: string;
  taxOrRegNumber?: string;
  status: SalonStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  status: UserStatus;
  roles: string[];
  totalBookings: number;
  totalSpent: number;
  savedSalonIds: string[];
  createdAt: string;
  lastActiveAt?: string;
}

export interface SalonOwnerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: UserStatus;
  salonId?: string;
  salonName?: string;
  applicationStatus: SalonStatus;
  rejectionReason?: string;
  subscriptionPlan: SubscriptionPlanId;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  salonId: string;
  salonName: string;
  salonAddress: string;
  salonPhone?: string;
  salonWhatsapp?: string;
  salonImage?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  staffId: string;
  staffName: string;
  services: { id: string; name: string; price: number; durationMinutes: number }[];
  totalDurationMinutes: number;
  bufferMinutes?: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  totalAmount: number;
  source: BookingSource;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  transactionRef: string;
  type: 'CUSTOMER_SERVICE' | 'SALON_SUBSCRIPTION';
  salonId?: string;
  salonName?: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  bookingId?: string;
  subscriptionId?: string;
  description: string;
  refundedAmount?: number;
  createdAt: string;
}

export interface PlatformSubscription {
  id: string;
  salonId: string;
  salonName: string;
  ownerId: string;
  ownerName: string;
  planId: SubscriptionPlanId;
  planName: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIAL';
  monthlyFee: number;
  currency: string;
  startDate: string;
  nextBillingDate: string;
  autoRenew: boolean;
  features: string[];
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'SALON_OWNER';
  salonId?: string;
  salonName?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToAdminName?: string;
  internalNotes?: string;
  replies: {
    id: string;
    sender: 'ADMIN' | 'USER';
    senderName: string;
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  targetCollection: string;
  targetId: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  timestamp: string;
  ipAddress?: string;
  result: 'SUCCESS' | 'FAILURE';
}

export interface DashboardStats {
  totalCustomers: number;
  totalOwners: number;
  totalSalons: number;
  pendingSalons: number;
  approvedSalons: number;
  rejectedSalons: number;
  suspendedSalons: number;
  totalBookings: number;
  todayBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  monthlySubscriptionRevenue: number;
  monthlySalonServiceVolume: number;
}
