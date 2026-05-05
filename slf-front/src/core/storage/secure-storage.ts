import * as ExpoSecureStore from 'expo-secure-store';
import type { SecureStorageKey } from './secure-storage-keys';

// Saves a value to the device's encrypted secure storage.
// Use this for sensitive data: tokens, user IDs.
export async function saveValueToSecureStorage(
  key: SecureStorageKey,
  value: string,
): Promise<void> {
  await ExpoSecureStore.setItemAsync(key, value);
}

// Reads a value from secure storage. Returns null if not found.
export async function readValueFromSecureStorage(
  key: SecureStorageKey,
): Promise<string | null> {
  try {
    return await ExpoSecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

// Deletes a value from secure storage. Used during logout.
export async function deleteValueFromSecureStorage(
  key: SecureStorageKey,
): Promise<void> {
  try {
    await ExpoSecureStore.deleteItemAsync(key);
  } catch {
    // If the key doesn't exist, that's fine — we just want it gone
  }
}
