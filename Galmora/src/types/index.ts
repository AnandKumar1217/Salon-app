export type BookingStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'PAY_AT_SALON' | 'ONLINE';
export type BookingSource = 'APP' | 'WHATSAPP' | 'WALK_IN' | 'WEB';

export type UserRole = 'customer' | 'salon_owner' | 'employee' | 'super_admin';
export type AppMode = 'CUSTOMER' | 'OWNER';
export type SalonApplicationStatus = 'UNAPPLIED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  gender?: 'female' | 'male' | 'other' | 'prefer_not_to_say';
  savedSalonIds: string[];
  roles: UserRole[];
  activeMode: AppMode;
  salonId?: string; // Associated salon if owner/employee
  applicationStatus?: SalonApplicationStatus;
  rejectionReason?: string;
  createdAt: string;
  fcmToken?: string;
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
  status: SalonApplicationStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ServiceItem {
  id: string;
  salonId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  durationMinutes: number;
  bufferMinutes?: number;
  gender: 'unisex' | 'women' | 'men';
  imageUrl?: string;
  popular?: boolean;
  isOnlineBookingEnabled?: boolean;
}

export interface StaffShiftBreak {
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface StaffWorkingHours {
  start: string;
  end: string;
  isWorking: boolean;
  breaks?: StaffShiftBreak[];
}

export interface Staff {
  id: string;
  salonId: string;
  name: string;
  role: string;
  avatar: string;
  phone?: string;
  email?: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  specialties: string[];
  serviceCategoryIds: string[];
  workingHours: Record<string, StaffWorkingHours>;
  isActive: boolean;
  permissions?: ('MANAGE_CALENDAR' | 'MANAGE_WALKINS' | 'MANAGE_STAFF' | 'VIEW_REPORTS')[];
}

export interface SalonReview {
  id: string;
  salonId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  serviceName?: string;
  date: string;
}

export interface Salon {
  id: string;
  slug: string; // URL-safe identifier for public booking
  ownerId: string;
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  images: string[];
  rating: number;
  reviewCount: number;
  address: string;
  area: string;
  city: string;
  postalCode?: string;
  distanceKm?: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  whatsappNumber: string;
  operatingHours: Record<string, { open: string; close: string; isOpen: boolean }>;
  bufferMinutes: number;
  cancellationWindowHours: number;
  amenities: string[];
  categories: string[];
  priceLevel: '$' | '$$' | '$$$';
  startingPrice: number;
  isFeatured: boolean;
  isOpenNow: boolean;
  isOnlineBookingPaused?: boolean;
  publicBookingUrl?: string;
  services?: ServiceItem[];
  staff?: Staff[];
  reviews?: SalonReview[];
}

export interface Booking {
  id: string;
  bookingCode: string;
  salonId: string;
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  salonWhatsapp: string;
  salonImage: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  staffId: string;
  staffName: string;
  services: ServiceItem[];
  totalDurationMinutes: number;
  bufferMinutes: number;
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
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduledFrom?: string;
  delayMinutes?: number;
  newStartTime?: string;
  serviceStartedAt?: string;
  serviceCompletedAt?: string;
}

export interface BlockedTime {
  id: string;
  salonId: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  reason: string;
  createdAt: string;
}

export interface SlotHold {
  id: string;
  salonId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  expiresAt: string; // ISO string (e.g. 5 minutes from creation)
  customerId?: string;
  heldAt: string;
}

export interface WaitingQueueItem {
  id: string;
  salonId: string;
  customerName: string;
  customerPhone: string;
  serviceIds: string[];
  serviceNames: string[];
  totalDurationMinutes: number;
  preferredStaffId?: string;
  preferredStaffName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  status: 'WAITING' | 'BEING_SERVED' | 'COMPLETED' | 'CANCELLED';
  estimatedWaitMinutes: number;
  joinedAt: string;
  serviceStartedAt?: string;
  completedAt?: string;
}

export interface DailyRevenueReport {
  date: string;
  totalRevenue: number;
  cashRevenue: number;
  onlineRevenue: number;
  completedBookingsCount: number;
  walkInCount: number;
  appBookingCount: number;
  whatsAppBookingCount: number;
  webBookingCount: number;
  cancelledCount: number;
}

export interface TimeSlot {
  time: string; // HH:MM
  endTime: string; // HH:MM
  available: boolean;
  staffId?: string;
  staffName?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING_CONFIRMED' | 'REMINDER' | 'RESCHEDULED' | 'CANCELLED' | 'DELAY' | 'PROMO' | 'WALK_IN_ALERT' | 'NEW_BOOKING_ALERT';
  bookingId?: string;
  createdAt: string;
  read: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export type ActivityRequestType =
  | 'BRANCH_EXPANSION'
  | 'OWNERSHIP_TRANSFER'
  | 'DOCUMENT_UPDATE'
  | 'PROMOTIONAL_REVIEW'
  | 'SERVICE_MENU_CHANGE';

export type ActivityRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ActivityRequest {
  id: string;
  salonId: string;
  salonName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  requestType: ActivityRequestType;
  title: string;
  description: string;
  status: ActivityRequestStatus;
  documents?: string[];
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
