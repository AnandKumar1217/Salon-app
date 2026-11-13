import { Salon, Booking, OwnerApplication } from '../types';
import { getSecureToken } from '../utils/secureStorage';

const BACKEND_API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

/**
 * Fetch live salons from MongoDB backend API
 */
export async function fetchSalonsFromBackend(filters?: {
  query?: string;
  category?: string;
}): Promise<Salon[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.query) params.append('query', filters.query);
    if (filters?.category && filters.category !== 'All') params.append('category', filters.category);

    const url = `${BACKEND_API_URL}/api/salons?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.salons || [];
  } catch (error) {
    console.warn('Backend fetchSalonsFromBackend notice:', error);
    return [];
  }
}

/**
 * Confirms and stores booking in MongoDB via backend API
 */
export async function createBookingInBackend(booking: Partial<Booking>): Promise<Booking> {
  const token = await getSecureToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_API_URL}/api/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(booking),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create booking' }));
    throw new Error(err.error || 'Failed to create booking');
  }

  const data = await res.json();
  return data.booking;
}

/**
 * Update booking status in MongoDB via backend API
 */
export async function updateBookingInBackend(
  bookingId: string,
  status: Booking['status'],
  delayMinutes?: number
): Promise<void> {
  const token = await getSecureToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_API_URL}/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status, delayMinutes }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update booking status: HTTP ${res.status}`);
  }
}

/**
 * Submit salon owner application to MongoDB via backend API
 */
export async function submitApplicationToBackend(application: Partial<OwnerApplication>): Promise<OwnerApplication> {
  const res = await fetch(`${BACKEND_API_URL}/api/owner-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit application' }));
    throw new Error(err.error || 'Failed to submit application');
  }

  const data = await res.json();
  return data.application;
}

