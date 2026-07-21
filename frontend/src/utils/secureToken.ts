import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const tokenStorage = {
  async getAccess(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_KEY);
    } catch (e) {
      console.error("Error reading access token", e);
      return null;
    }
  },

  async setAccess(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_KEY, token);
    } catch (e) {
      console.error("Error setting access token", e);
    }
  },

  async getRefresh(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY);
    } catch (e) {
      console.error("Error reading refresh token", e);
      return null;
    }
  },

  async setRefresh(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_KEY, token);
    } catch (e) {
      console.error("Error setting refresh token", e);
    }
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch (e) {
      console.error("Error clearing tokens", e);
    }
  },
};
