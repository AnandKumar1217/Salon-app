import AsyncStorage from '@react-native-async-storage/async-storage';
import { InAppNotification } from '../types';
import { INITIAL_NOTIFICATIONS } from '../constants/mockData';
import { getSecureToken } from '../utils/secureStorage';

const NOTIFS_STORAGE_KEY = '@glamora_notifications_v1';
const BACKEND_API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function fetchNotifications(userId?: string): Promise<InAppNotification[]> {
  try {
    const token = await getSecureToken();
    const url = new URL(`${BACKEND_API_URL}/api/notifications`);
    if (userId) url.searchParams.set('userId', userId);

    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.notifications) && data.notifications.length > 0) {
        await AsyncStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(data.notifications));
        return data.notifications;
      }
    }
  } catch (err) {
    // Network offline; fall back to local AsyncStorage cache
  }

  try {
    const raw = await AsyncStorage.getItem(NOTIFS_STORAGE_KEY);
    if (!raw) {
      const isMockAllowed =
        process.env.NODE_ENV !== 'production' &&
        process.env.EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK === 'true';
      if (isMockAllowed) {
        await AsyncStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<InAppNotification[]> {
  try {
    const token = await getSecureToken();
    await fetch(`${BACKEND_API_URL}/api/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id }),
    });
  } catch {
    // ignore backend error, update local cache
  }

  const current = await fetchNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  await AsyncStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function markAllNotificationsAsRead(userId?: string): Promise<InAppNotification[]> {
  try {
    const token = await getSecureToken();
    await fetch(`${BACKEND_API_URL}/api/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ markAll: true, userId }),
    });
  } catch {
    // ignore backend error, update local cache
  }

  const current = await fetchNotifications(userId);
  const updated = current.map((n) => ({ ...n, read: true }));
  await AsyncStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function addInAppNotification(
  title: string,
  message: string,
  type: InAppNotification['type'],
  bookingId?: string
): Promise<InAppNotification> {
  const current = await fetchNotifications();
  const newNotif: InAppNotification = {
    id: `notif_${Date.now()}`,
    userId: 'usr_glamora_demo',
    title,
    message,
    type,
    bookingId,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const updated = [newNotif, ...current];
  await AsyncStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(updated));
  return newNotif;
}
