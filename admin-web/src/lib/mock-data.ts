import {
  AdminUser,
  Salon,
  OwnerApplication,
  CustomerUser,
  SalonOwnerUser,
  Booking,
  PaymentTransaction,
  PlatformSubscription,
  SupportTicket,
  AdminAuditLog,
  DashboardStats,
} from './types';

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'adm_super_1',
    email: 'admin@glamora.com',
    name: 'Super Administrator',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_SALONS: Salon[] = [];
export const INITIAL_OWNER_APPLICATIONS: OwnerApplication[] = [];
export const INITIAL_CUSTOMERS: CustomerUser[] = [];
export const INITIAL_OWNERS: SalonOwnerUser[] = [];
export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_PAYMENTS: PaymentTransaction[] = [];
export const INITIAL_SUBSCRIPTIONS: PlatformSubscription[] = [];
export const INITIAL_TICKETS: SupportTicket[] = [];
export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [];

export const INITIAL_DASHBOARD_STATS: DashboardStats = {
  totalCustomers: 0,
  totalOwners: 0,
  totalSalons: 0,
  pendingSalons: 0,
  approvedSalons: 0,
  rejectedSalons: 0,
  suspendedSalons: 0,
  totalBookings: 0,
  todayBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  monthlySubscriptionRevenue: 0,
  monthlySalonServiceVolume: 0,
};
