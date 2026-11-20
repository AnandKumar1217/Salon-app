import {
  Salon,
  ServiceCategory,
  Booking,
  InAppNotification,
  UserProfile,
  BlockedTime,
  WaitingQueueItem,
  DailyRevenueReport,
} from '../types';

export const CATEGORIES: ServiceCategory[] = [
  {
    id: 'hair',
    name: 'Hair & Styling',
    icon: 'content-cut',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'color',
    name: 'Color & Highlights',
    icon: 'palette-outline',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'facial',
    name: 'Facial & Glow',
    icon: 'sparkles-outline',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'nails',
    name: 'Nails & Mani-Pedi',
    icon: 'hand-left-outline',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'beard',
    name: 'Beard & Grooming',
    icon: 'man-outline',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'spa',
    name: 'Head Massage & Spa',
    icon: 'water-outline',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
  },
];

export const INITIAL_USER: UserProfile = {
  id: '',
  name: '',
  phone: '',
  email: '',
  savedSalonIds: [],
  roles: ['customer'],
  activeMode: 'CUSTOMER',
  applicationStatus: 'UNAPPLIED',
  createdAt: new Date().toISOString(),
};

export const DEMO_PRESETS: Record<string, UserProfile> = {};

export const SALONS: Salon[] = [];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [];

export const INITIAL_WAITING_QUEUE: WaitingQueueItem[] = [];

export const INITIAL_BLOCKED_TIMES: BlockedTime[] = [];

export const INITIAL_REVENUE_REPORT: DailyRevenueReport = {
  date: new Date().toISOString().split('T')[0],
  totalRevenue: 0,
  cashRevenue: 0,
  onlineRevenue: 0,
  completedBookingsCount: 0,
  walkInCount: 0,
  appBookingCount: 0,
  whatsAppBookingCount: 0,
  webBookingCount: 0,
  cancelledCount: 0,
};

export const INITIAL_SALON_BOOKINGS: Booking[] = [];
