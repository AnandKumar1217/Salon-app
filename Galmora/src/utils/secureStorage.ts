/**
 * Secure Storage Utility for Glamora Mobile App
 * Backed by expo-secure-store (Android Keystore / iOS Keychain)
 * Includes automated migration from legacy unencrypted AsyncStorage.
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SECURE_TOKEN_KEY = 'glamora_auth_jwt_token';
const SECURE_USER_SESSION_KEY = 'glamora_secure_user_meta';
const LEGACY_ASYNC_TOKEN_KEY = '@glamora_auth_token_legacy';
const LEGACY_ASYNC_USER_KEY = '@glamora_auth_user_v2';

let isMigrationDone = false;

/**
 * Checks if hardware-backed SecureStore is supported on current runtime
 */
async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Automatically migrates existing credentials from AsyncStorage to hardware-backed SecureStore
 */
export async function migrateLegacyStorageToSecureStore(): Promise<void> {
  if (isMigrationDone) return;
  try {
    const hasSecure = await isSecureStoreAvailable();
    if (!hasSecure) return;

    // 1. Check for legacy plaintext token in AsyncStorage
    const legacyToken = await AsyncStorage.getItem(LEGACY_ASYNC_TOKEN_KEY);
    if (legacyToken) {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacyToken, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
      // Delete unencrypted token immediately
      await AsyncStorage.removeItem(LEGACY_ASYNC_TOKEN_KEY);
    }

    // 2. Check for legacy user profile and strip sensitive fields if any
    const legacyUser = await AsyncStorage.getItem(LEGACY_ASYNC_USER_KEY);
    if (legacyUser) {
      try {
        const parsed = JSON.parse(legacyUser);
        if (parsed.password || parsed.token) {
          delete parsed.password;
          delete parsed.token;
          await AsyncStorage.setItem(LEGACY_ASYNC_USER_KEY, JSON.stringify(parsed));
        }
      } catch {
        // ignore parse error
      }
    }

    isMigrationDone = true;
  } catch (err) {
    console.warn('[SecureStorage] Migration warning:', err);
  }
}

/**
 * Saves authentication JWT token in encrypted Keystore
 */
export async function saveSecureToken(token: string): Promise<void> {
  try {
    const hasSecure = await isSecureStoreAvailable();
    if (hasSecure) {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } else {
      // Fallback for web preview environment
      await AsyncStorage.setItem(SECURE_TOKEN_KEY, token);
    }
  } catch (err) {
    console.error('[SecureStorage] saveSecureToken error:', err);
    throw err;
  }
}

/**
 * Retrieves authentication JWT token from encrypted Keystore
 */
export async function getSecureToken(): Promise<string | null> {
  try {
    await migrateLegacyStorageToSecureStore();
    const hasSecure = await isSecureStoreAvailable();
    if (hasSecure) {
      return await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    }
    return await AsyncStorage.getItem(SECURE_TOKEN_KEY);
  } catch (err) {
    console.warn('[SecureStorage] getSecureToken error:', err);
    return null;
  }
}

/**
 * Deletes authentication JWT token and credentials upon logout
 */
export async function deleteSecureToken(): Promise<void> {
  try {
    const hasSecure = await isSecureStoreAvailable();
    if (hasSecure) {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SECURE_USER_SESSION_KEY);
    } else {
      await AsyncStorage.removeItem(SECURE_TOKEN_KEY);
      await AsyncStorage.removeItem(SECURE_USER_SESSION_KEY);
    }
    // Also remove legacy keys to guarantee complete cleanup
    await AsyncStorage.removeItem(LEGACY_ASYNC_TOKEN_KEY);
  } catch (err) {
    console.warn('[SecureStorage] deleteSecureToken error:', err);
  }
}

