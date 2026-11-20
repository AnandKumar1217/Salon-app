import React, { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { OwnerSalonProvider } from './src/context/OwnerSalonContext';
import { LocationProvider } from './src/context/LocationContext';
import { BookingsProvider } from './src/context/BookingsContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RootStackParamList } from './src/navigation/types';
import {
  setupNotificationListeners,
  checkColdStartNotification,
  routeNotificationResponse,
} from './src/utils/pushNotifications';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const isNavReadyRef = useRef(false);
  const pendingNotificationRef = useRef<any>(null);

  const handleNotificationTap = (response: any) => {
    if (!response) return;
    if (isNavReadyRef.current && navigationRef.isReady()) {
      routeNotificationResponse(response, (screen, params) => {
        (navigationRef.navigate as any)(screen, params);
      });
    } else {
      pendingNotificationRef.current = response;
    }
  };

  useEffect(() => {
    // 1. Subscribe to active notification listeners (foreground and background taps)
    const cleanupListeners = setupNotificationListeners(
      (notification) => {
        console.log('[Glamora Push] Foreground notification received:', notification.request.content.title);
      },
      (response) => {
        console.log('[Glamora Push] Notification tapped by user:', response.notification.request.content.title);
        handleNotificationTap(response);
      }
    );

    // 2. Safe Android hardware back handler: prevents unhandled GO_BACK errors
    const onHardwareBack = () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      return false; // Allow Android to exit cleanly without unhandled GO_BACK error
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);

    return () => {
      cleanupListeners();
      backSub.remove();
    };
  }, []);

  const onNavigationReady = () => {
    isNavReadyRef.current = true;
    // 2. Check for cold-start launch via notification tap
    checkColdStartNotification(handleNotificationTap);

    // 3. Process any pending notification tap queued before navigation container was ready
    if (pendingNotificationRef.current && navigationRef.isReady()) {
      const pending = pendingNotificationRef.current;
      pendingNotificationRef.current = null;
      handleNotificationTap(pending);
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={onNavigationReady}
        onUnhandledAction={(action) => {
          // Gracefully suppress unhandled GO_BACK actions across all navigators
          if (action.type === 'GO_BACK') {
            return;
          }
        }}
      >
        <AuthProvider>
          <OwnerSalonProvider>
            <LocationProvider>
              <BookingsProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </BookingsProvider>
            </LocationProvider>
          </OwnerSalonProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
