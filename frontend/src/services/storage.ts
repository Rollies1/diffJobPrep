/**
 * Secure storage wrapper — matches your existing src/services/storage.ts.
 * expo-secure-store with AsyncStorage fallback.
 */
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const canUseSecureStore = Platform.OS !== 'web' && true

async function getItem(key: string): Promise<string | null> {
  if (canUseSecureStore) {
    return SecureStore.getItemAsync(key)
  }
  return AsyncStorage.getItem(key)
}

async function setItem(key: string, value: string): Promise<void> {
  if (canUseSecureStore) {
    await SecureStore.setItemAsync(key, value)
  } else {
    await AsyncStorage.setItem(key, value)
  }
}

async function deleteItem(key: string): Promise<void> {
  if (canUseSecureStore) {
    await SecureStore.deleteItemAsync(key)
  } else {
    await AsyncStorage.removeItem(key)
  }
}

const KEYS = {
  ACCESS: 'jp_access_token',
  REFRESH: 'jp_refresh_token',
  USER: 'jp_user',
  DEVICE: 'jp_device_id',
} as const

export const storage = {
  getAccessToken: () => getItem(KEYS.ACCESS),
  getRefreshToken: () => getItem(KEYS.REFRESH),
  setTokens: (access: string, refresh: string) =>
    Promise.all([setItem(KEYS.ACCESS, access), setItem(KEYS.REFRESH, refresh)]),
  clearTokens: () => Promise.all([deleteItem(KEYS.ACCESS), deleteItem(KEYS.REFRESH)]),

  getUser: async (): Promise<string | null> => getItem(KEYS.USER),
  setUser: (user: string) => setItem(KEYS.USER, user),
  clearUser: () => deleteItem(KEYS.USER),

  // Stable device id for sync endpoints (X-Device-Id header).
  getDeviceId: async (): Promise<string> => {
    let id = await getItem(KEYS.DEVICE)
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      await setItem(KEYS.DEVICE, id)
    }
    return id
  },
  setDeviceId: (id: string) => setItem(KEYS.DEVICE, id),

  clearAll: () =>
    Promise.all([deleteItem(KEYS.ACCESS), deleteItem(KEYS.REFRESH), deleteItem(KEYS.USER)]),
}

export { KEYS }
