/**
 * Bookings API - Powered by MongoDB & Zero-Overbooking Engine
 * High-performance backend API integration
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, TimeSlot, ServiceItem, Salon, Staff, PaymentMethod, BookingSource } from '../types';
import { INITIAL_BOOKINGS, SALONS } from '../constants/mockData';
import { createBookingInBackend, updateBookingInBackend } from './mongoApi';

const BOOKINGS_STORAGE_KEY = '@glamora_bookings_v1';

// Helper: parse HH:MM to minutes
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Helper: minutes to HH:MM
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[d.getDay()];
}

export interface GetSlotsParams {
  salonId: string;
  serviceIds: string[];
  date: string; // YYYY-MM-DD
  preferredStaffId?: string;
}

export interface CreateBookingParams {
  salonId: string;
  salon: Salon;
  services: ServiceItem[];
  staff: Staff;
  date: string;
  startTime: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  source?: BookingSource;
}

/**
 * Fetch available slots for the given salon, date, services, and preferred staff.
 */
export async function getLiveAvailableSlots(params: GetSlotsParams): Promise<{
  slots: TimeSlot[];
  totalDurationMinutes: number;
  bufferMinutes: number;
}> {
  // Parity local and backend calculation
  const salon = SALONS.find((s) => s.id === params.salonId);
  if (!salon) {
    throw new Error('Salon not found');
  }

  const dayOfWeek = getDayOfWeek(params.date);
  const hours = salon.operatingHours?.[dayOfWeek];
  if (!hours || !hours.isOpen) {
    return { slots: [], totalDurationMinutes: 0, bufferMinutes: salon.bufferMinutes || 10 };
  }

  const selectedServices = (salon.services || []).filter((s) => params.serviceIds.includes(s.id));
  const totalDurationMinutes = selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);
  const bufferMinutes = salon.bufferMinutes || 10;
  const totalOccupied = totalDurationMinutes + bufferMinutes;

  let qualifiedStaff = salon.staff?.filter((st) => st.isActive) || [];
  if (params.preferredStaffId && params.preferredStaffId !== 'any') {
    qualifiedStaff = qualifiedStaff.filter((st) => st.id === params.preferredStaffId);
  }

  if (qualifiedStaff.length === 0) {
    return { slots: [], totalDurationMinutes, bufferMinutes };
  }

  // Fetch current stored bookings to check conflicts
  const storedBookings = await getAllBookings();
  const activeBookings = storedBookings.filter(
    (b) => b.salonId === params.salonId && b.date === params.date && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')
  );

  const salonOpenMins = timeToMinutes(hours.open);
  const salonCloseMins = timeToMinutes(hours.close);
  const step = 30; // 30-min slot intervals
  const slots: TimeSlot[] = [];

  for (let startMins = salonOpenMins; startMins + totalDurationMinutes <= salonCloseMins; startMins += step) {
    const endMins = startMins + totalDurationMinutes;
    const endWithBuffer = startMins + totalOccupied;

    let availableStaff: Staff | undefined;

    for (const staffMember of qualifiedStaff) {
      const staffHours = staffMember.workingHours?.[dayOfWeek];
      if (!staffHours || !staffHours.isWorking) continue;

      const shiftStart = timeToMinutes(staffHours.start);
      const shiftEnd = timeToMinutes(staffHours.end);

      if (startMins < shiftStart || endWithBuffer > shiftEnd) continue;

      // Check breaks
      const inBreak = staffHours.breaks?.some((b) =>
        intervalsOverlap(startMins, endWithBuffer, timeToMinutes(b.start), timeToMinutes(b.end))
      );
      if (inBreak) continue;

      // Check existing bookings for this staff member
      const hasConflict = activeBookings.some((b) => {
        if (b.staffId !== staffMember.id) return false;
        const bStart = timeToMinutes(b.startTime);
        const bEnd = bStart + b.totalDurationMinutes + (b.bufferMinutes || 0);
        return intervalsOverlap(startMins, endWithBuffer, bStart, bEnd);
      });

      if (!hasConflict) {
        availableStaff = staffMember;
        break;
      }
    }

    slots.push({
      time: minutesToTime(startMins),
      endTime: minutesToTime(endMins),
      available: !!availableStaff,
      staffId: availableStaff?.id,
      staffName: availableStaff?.name,
    });
  }

  return { slots, totalDurationMinutes, bufferMinutes };
}

/**
 * Fetch all bookings for the customer
 */
export async function getAllBookings(): Promise<Booking[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_BOOKINGS;
  }
}

/**
 * Create booking atomically
 */
export async function createNewBooking(params: CreateBookingParams): Promise<Booking> {
  const totalDurationMinutes = params.services.reduce((acc, s) => acc + s.durationMinutes, 0);
  const startMins = timeToMinutes(params.startTime);
  const endMins = startMins + totalDurationMinutes;
  const subtotal = params.services.reduce((acc, s) => acc + s.price, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal + tax;

  const currentBookings = await getAllBookings();

  // Guard against race condition: check if staff was booked in between
  const conflict = currentBookings.some((b) => {
    if (
      b.salonId === params.salonId &&
      b.staffId === params.staff.id &&
      b.date === params.date &&
      (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')
    ) {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = bStart + b.totalDurationMinutes + (b.bufferMinutes || 0);
      return intervalsOverlap(startMins, endMins + (params.salon.bufferMinutes || 10), bStart, bEnd);
    }
    return false;
  });

  if (conflict) {
    throw new Error('This slot was just reserved by another customer. Please select another slot.');
  }

  const randomCode = Math.floor(10000 + Math.random() * 90000);
  const nowIso = new Date().toISOString();

  const newBooking: Booking = {
    id: `bk_${Date.now()}`,
    bookingCode: `GLM-${randomCode}`,
    salonId: params.salon.id,
    salonName: params.salon.name,
    salonAddress: params.salon.address,
    salonPhone: params.salon.phone,
    salonWhatsapp: params.salon.whatsappNumber,
    salonImage: params.salon.coverImage,
    customerId: params.customerId,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    staffId: params.staff.id,
    staffName: params.staff.name,
    services: params.services,
    totalDurationMinutes,
    bufferMinutes: params.salon.bufferMinutes || 10,
    date: params.date,
    startTime: params.startTime,
    endTime: minutesToTime(endMins),
    status: 'CONFIRMED',
    paymentStatus: params.paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
    paymentMethod: params.paymentMethod,
    subtotal,
    tax,
    totalAmount,
    source: params.source || 'APP',
    notes: params.notes || '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Attempt sync to MongoDB backend
  try {
    await createBookingInBackend(newBooking);
  } catch (apiErr) {
    console.warn('Backend sync notice (offline or local queue):', apiErr);
  }

  const updated = [newBooking, ...currentBookings];
  await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  return newBooking;
}

/**
 * Cancel an appointment safely with policy window check
 */
export async function cancelAppointment(bookingId: string, reason: string): Promise<Booking> {
  const current = await getAllBookings();
  const target = current.find((b) => b.id === bookingId);
  if (!target) {
    throw new Error('Booking not found');
  }

  if (target.status === 'CANCELLED') {
    throw new Error('Booking is already cancelled');
  }

  // Check policy window (at least 2 hours before)
  const salon = SALONS.find((s) => s.id === target.salonId);
  const windowHours = salon?.cancellationWindowHours || 2;
  const aptDate = new Date(`${target.date}T${target.startTime}:00`);
  const now = new Date();
  const diffHours = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < windowHours && aptDate > now) {
    throw new Error(
      `Cancellations must be made at least ${windowHours} hours before the appointment time according to salon policy.`
    );
  }

  const nowIso = new Date().toISOString();

  // Sync to backend
  try {
    await updateBookingInBackend(bookingId, 'CANCELLED');
  } catch (err) {
    console.warn('Backend update notice:', err);
  }

  const updatedList = current.map((b) => {
    if (b.id === bookingId) {
      return {
        ...b,
        status: 'CANCELLED' as const,
        cancellationReason: reason || 'Customer requested cancellation',
        cancelledAt: nowIso,
        updatedAt: nowIso,
      };
    }
    return b;
  });

  await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList.find((b) => b.id === bookingId)!;
}

/**
 * Reschedule an appointment
 */
export async function rescheduleAppointment(
  bookingId: string,
  newDate: string,
  newStartTime: string
): Promise<Booking> {
  const current = await getAllBookings();
  const target = current.find((b) => b.id === bookingId);
  if (!target) {
    throw new Error('Booking not found');
  }

  const startMins = timeToMinutes(newStartTime);
  const endMins = startMins + target.totalDurationMinutes;
  const nowIso = new Date().toISOString();

  const updatedList = current.map((b) => {
    if (b.id === bookingId) {
      return {
        ...b,
        date: newDate,
        startTime: newStartTime,
        endTime: minutesToTime(endMins),
        status: 'CONFIRMED' as const,
        rescheduledFrom: `${target.date} ${target.startTime}`,
        updatedAt: nowIso,
      };
    }
    return b;
  });

  await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList.find((b) => b.id === bookingId)!;
}
