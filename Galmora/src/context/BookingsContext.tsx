import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking } from '../types';
import {
  getAllBookings,
  createNewBooking,
  cancelAppointment,
  rescheduleAppointment,
  CreateBookingParams,
} from '../api/bookingsApi';
import { addInAppNotification } from '../api/notificationsApi';

interface BookingsContextType {
  bookings: Booking[];
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  isLoading: boolean;
  activeUpcomingBooking: Booking | null;
  refreshBookings: () => Promise<void>;
  createBooking: (params: CreateBookingParams) => Promise<Booking>;
  cancelBooking: (bookingId: string, reason: string) => Promise<Booking>;
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string) => Promise<Booking>;
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const list = await getAllBookings();
      setBookings(list);
    } catch (e) {
      console.warn('Error loading bookings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBookings = async () => {
    const list = await getAllBookings();
    setBookings(list);
  };

  const handleCreateBooking = async (params: CreateBookingParams): Promise<Booking> => {
    const booking = await createNewBooking(params);
    setBookings((prev) => [booking, ...prev]);

    // Add local notification
    await addInAppNotification(
      'Appointment Confirmed! ✨',
      `Your booking #${booking.bookingCode} at ${booking.salonName} is confirmed for ${booking.date} at ${booking.startTime}.`,
      'BOOKING_CONFIRMED',
      booking.id
    );

    return booking;
  };

  const handleCancelBooking = async (bookingId: string, reason: string): Promise<Booking> => {
    const updated = await cancelAppointment(bookingId, reason);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));

    await addInAppNotification(
      'Appointment Cancelled',
      `Your booking #${updated.bookingCode} at ${updated.salonName} was cancelled.`,
      'CANCELLED',
      bookingId
    );

    return updated;
  };

  const handleRescheduleBooking = async (
    bookingId: string,
    newDate: string,
    newTime: string
  ): Promise<Booking> => {
    const updated = await rescheduleAppointment(bookingId, newDate, newTime);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));

    await addInAppNotification(
      'Appointment Rescheduled 📅',
      `Your booking #${updated.bookingCode} has been rescheduled to ${newDate} at ${newTime}.`,
      'RESCHEDULED',
      bookingId
    );

    return updated;
  };

  // Classify upcoming vs past
  const now = new Date();
  const upcomingBookings = bookings
    .filter((b) => {
      if (b.status === 'CANCELLED') return false;
      const bDate = new Date(`${b.date}T${b.startTime}:00`);
      return bDate >= now || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS';
    })
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const pastBookings = bookings
    .filter((b) => {
      if (b.status === 'CANCELLED') return true;
      const bDate = new Date(`${b.date}T${b.startTime}:00`);
      return bDate < now || b.status === 'COMPLETED';
    })
    .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

  const activeUpcomingBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

  return (
    <BookingsContext.Provider
      value={{
        bookings,
        upcomingBookings,
        pastBookings,
        isLoading,
        activeUpcomingBooking,
        refreshBookings,
        createBooking: handleCreateBooking,
        cancelBooking: handleCancelBooking,
        rescheduleBooking: handleRescheduleBooking,
      }}
    >
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingsProvider');
  }
  return context;
};

