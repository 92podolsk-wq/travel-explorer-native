import * as SecureStore from "expo-secure-store";

// The bearer token authenticates every API call — mirrors the web app's
// device-token-storage.ts, but SecureStore-backed (Keystore) instead of
// Capacitor Preferences, since this is the app's only credential (no cookie
// fallback exists on native).
const STORAGE_KEY = "wayora-device-token";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, token);
  } catch {
    // ignore storage failures
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // ignore
  }
}
