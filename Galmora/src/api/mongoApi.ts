import { Salon, Booking, OwnerApplication, ActivityRequest } from '../types';
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
 * Persist or update salon profile and listing in MongoDB via backend API
 */
export async function saveSalonToBackend(salon: Partial<Salon> & { id: string }): Promise<Salon> {
  const token = await getSecureToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_API_URL}/api/salons`, {
    method: 'POST',
    headers,
    body: JSON.stringify(salon),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update salon profile' }));
    throw new Error(err.error || 'Failed to update salon profile');
  }

  const data = await res.json();
  return data.salon;
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

/**
 * Fetch live bookings from MongoDB backend API
 */
export async function fetchBookingsFromBackend(params?: {
  customerId?: string;
  salonId?: string;
}): Promise<Booking[]> {
  try {
    const urlParams = new URLSearchParams();
    if (params?.customerId) urlParams.append('customerId', params.customerId);
    if (params?.salonId) urlParams.append('salonId', params.salonId);

    const token = await getSecureToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BACKEND_API_URL}/api/bookings?${urlParams.toString()}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.bookings || [];
  } catch (error) {
    console.warn('Backend fetchBookingsFromBackend notice:', error);
    return [];
  }
}

/**
 * Submit salon activity approval request (expansion, documents, ownership) to MongoDB
 */
export async function submitActivityRequestToBackend(
  request: Partial<ActivityRequest>
): Promise<ActivityRequest> {
  const token = await getSecureToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_API_URL}/api/activity-requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit activity request' }));
    throw new Error(err.error || 'Failed to submit activity request');
  }

  const data = await res.json();
  return data.request;
}

/**
 * Fetch salon activity requests from MongoDB backend API
 */
export async function fetchActivityRequestsFromBackend(salonId?: string): Promise<ActivityRequest[]> {
  try {
    const token = await getSecureToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const urlParams = new URLSearchParams();
    if (salonId) urlParams.append('salonId', salonId);

    const res = await fetch(`${BACKEND_API_URL}/api/activity-requests?${urlParams.toString()}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.requests || [];
  } catch (error) {
    console.warn('Backend fetchActivityRequestsFromBackend notice:', error);
    return [];
  }
}


