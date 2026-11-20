import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Safely navigates back if there is a screen in the history stack,
 * otherwise navigates to a safe fallback screen instead of crashing
 * with "The action 'GO_BACK' was not handled by any navigator".
 */
export function safeGoBack(
  navigation: any,
  fallbackScreen: string = 'RoleSelection',
  fallbackParams?: any
): void {
  try {
    if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
  } catch (e) {
    // Ignore and proceed to fallback
  }

  try {
    if (navigation && typeof navigation.navigate === 'function') {
      if (fallbackParams !== undefined) {
        navigation.navigate(fallbackScreen, fallbackParams);
      } else {
        navigation.navigate(fallbackScreen);
      }
    }
  } catch (err) {
    console.warn('[Navigation] safeGoBack fallback navigation failed:', err);
  }
}

/**
 * Custom React hook to bind Android hardware back press to a custom callback safely.
 */
export function useHardwareBackHandler(onBack: () => boolean | void, deps: any[] = []): void {
  useEffect(() => {
    const handlePress = () => {
      const result = onBack();
      return result === false ? false : true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handlePress);
    return () => subscription.remove();
  }, deps);
}
