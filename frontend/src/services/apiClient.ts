import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useOfflineStore } from '@/stores/useOfflineStore';

// We use localhost because we ran `adb reverse tcp:8089 tcp:8089` to forward USB traffic directly to the PC
const BASE_URL = 'http://localhost:8089';

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

import * as Crypto from 'expo-crypto';

// ─── Request Interceptor: Inject Access Token & Device ID ──────
apiClient.interceptors.request.use(async (config) => {
  // Access Token
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Device ID
  let deviceId = await SecureStore.getItemAsync('device_id');
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await SecureStore.setItemAsync('device_id', deviceId as string);
  }
  config.headers['X-Device-Id'] = deviceId;
  
  return config;
});

// ─── Response Interceptor: Silent Refresh on 401 ────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => refreshSubscribers.forEach(cb => cb(token));
const subscribeRefresh = (cb: (token: string) => void) => refreshSubscribers.push(cb);

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Do not attempt to refresh if the request was to the auth endpoints
    const isAuthRequest = originalRequest?.url?.includes('/auth/');

    if (err.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve) => {
          subscribeRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data;
        await SecureStore.setItemAsync('access_token', accessToken);
        await SecureStore.setItemAsync('refresh_token', newRefreshToken);

        onRefreshed(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Refresh failed — clear tokens and let caller handle logout
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
        refreshSubscribers = [];
      }
    }

    return Promise.reject(err);
  }
);

// ─── Offline Queue Integration ──────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const netInfo = await import('expo-network').then(m => m.getNetworkStateAsync());
  // In local dev, isInternetReachable can be false even when the local server is reachable.
  // Also, we never want to queue authentication requests.
  const isOffline = !netInfo.isConnected;
  const isAuthRequest = config.url?.includes('/auth/');

  if (isOffline && config.method !== 'get' && !isAuthRequest) {
    // Queue mutation for later sync
    const action = {
      actionId: Crypto.randomUUID(),
      type: `${config.method?.toUpperCase()}_${config.url}`,
      endpoint: config.url,
      payload: config.data,
      timestamp: Date.now(),
    };
    useOfflineStore.getState().enqueue(action);
    throw new axios.Cancel('Offline: request queued');
  }

  return config;
});

export default apiClient;
