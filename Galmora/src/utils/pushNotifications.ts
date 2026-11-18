/**
 * Glamora Mobile Push Notification Utility
 * Powered by expo-notifications and Expo Push Service
 * Compatible with Android (FCM v1 / Expo Gateway) and iOS (APNs / Expo Gateway)
 * Zero Firebase client SDKs, zero Firestore.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getSecureToken } from './secureStorage';

const PUSH_TOKEN_STORAGE_KEY = '@glamora_push_token_v1';
const BACKEND_API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// Configure foreground notification behavior: banner + sound + badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers device for push notifications, sets Android notification channels,
 * fetches Expo push token and syncs with Glamora MongoDB backend.
 */
export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  let token: string | null = null;

  try {
    // 1. Android Notification Channel Configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('glamora-default', {
        name: 'Glamora Bookings & Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // 2. Permission Check & Request
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Glamora Push] Notification permission not granted');
        return null;
      }

      // 3. Obtain Expo Push Token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenResponse.data;

      if (token) {
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
        await syncPushTokenWithBackend(token, userId);
      }
    } else {
      console.log('[Glamora Push] Push tokens require physical hardware');
    }
  } catch (error: any) {
    console.warn('[Glamora Push] Registration notice:', error.message);
  }

  return token;
}

/**
 * Syncs the acquired push token with Glamora MongoDB central backend
 */
export async function syncPushTokenWithBackend(pushToken: string, userId?: string): Promise<boolean> {
  try {
    const jwtToken = await getSecureToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    const res = await fetch(`${BACKEND_API_URL}/api/users/push-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pushToken,
        userId,
        platform: Platform.OS,
      }),
    });

    return res.ok;
  } catch (error: any) {
    console.warn('[Glamora Push] Backend sync note (backend may be offline in dev):', error.message);
    return false;
  }
}

/**
 * Returns currently cached push token from local storage
 */
export async function getCachedPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Subscribes to incoming push notifications and user notification interactions
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Checks for a cold-start notification response if the app was launched by tapping a notification.
 */
export async function checkColdStartNotification(
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
      onNotificationTapped(lastResponse);
    }
  } catch (err: any) {
    console.warn('[Push Notification] Error checking cold start response:', err.message);
  }
}

/**
 * Parses notification response and dispatches navigation to the appropriate screen.
 * Handles booking confirmations, owner new bookings, status changes, applications, suspensions, and system notices.
 */
export function routeNotificationResponse(
  response: Notifications.NotificationResponse,
  navigate: (screen: string, params?: any) => void
): void {
  const data = (response?.notification?.request?.content?.data || {}) as Record<string, any>;
  const bookingId = typeof data.bookingId === 'string' ? data.bookingId : undefined;
  const salonId = typeof data.salonId === 'string' ? data.salonId : undefined;
  const type = typeof data.type === 'string' ? data.type : undefined;
  const reason = typeof data.reason === 'string' ? data.reason : undefined;
  const screen = typeof data.screen === 'string' ? data.screen : undefined;

  // 1. Explicit screen navigation if defined in payload
  if (screen) {
    navigate(screen, data.params || {});
    return;
  }

  // 2. Booking-related notifications -> Appointment Detail
  if (bookingId) {
    navigate('AppointmentDetail', { bookingId });
    return;
  }

  // 3. Salon exploration / updates -> Salon Detail
  if (salonId) {
    navigate('SalonDetail', { salonId });
    return;
  }

  // 4. Owner Application approved -> Unlock & navigate to Owner Dashboard
  if (type === 'OWNER_APPLICATION_APPROVED') {
    navigate('OwnerTabs');
    return;
  }

  // 5. Owner Application rejected -> Rejection notice with reason
  if (type === 'OWNER_APPLICATION_REJECTED') {
    navigate('RejectedApplication', { reason: reason || 'Application requires review.' });
    return;
  }

  // 6. Salon or Account Suspended
  if (type === 'ACCOUNT_SUSPENDED' || type === 'SALON_SUSPENDED') {
    navigate('SuspendedAccount', { reason: reason || 'Account has been temporarily suspended.' });
    return;
  }

  // 7. General fallback -> In-app Notifications center
  navigate('Notifications');
}
