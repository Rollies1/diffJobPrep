// @ts-nocheck
/**
 * Single Axios instance with JWT auth, automatic token refresh on 401,
 * device-id injection, and offline mutation queueing.
 *
 * This is the ONE API client for the whole app. The legacy `apiClient.ts`
 * re-exports this instance so existing imports keep working — but there is
 * now a single token store (`storage.ts`) and a single refresh interceptor.
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { Platform } from 'react-native'
import { storage } from './storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  android: 'http://10.0.2.2:8089/api',
  ios: 'http://localhost:8089/api',
  default: 'http://10.0.2.2:8089/api',
}) as string

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach access token + device id on every request ──────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getAccessToken()
  const deviceId = await storage.getDeviceId()

  config.headers = config.headers ?? {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId
  }
  return config
})

// ── Offline queue: enqueue mutations when disconnected ────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Lazy-load to avoid a hard dep on expo-network at module eval time.
  let isOffline = false
  try {
    const { getNetworkStateAsync } = await import('expo-network')
    const netInfo = await getNetworkStateAsync()
    isOffline = !netInfo.isConnected
  } catch {
    // expo-network unavailable (e.g. web) — assume online.
  }

  const isAuthRequest = config.url?.includes('/auth/')
  if (isOffline && config.method !== 'get' && !isAuthRequest) {
    try {
      const { useOfflineStore } = await import('../stores/useOfflineStore')
      const Crypto = await import('expo-crypto')
      const action = {
        actionId: Crypto.randomUUID(),
        type: `${config.method?.toUpperCase()}_${config.url}`,
        endpoint: config.url,
        payload: config.data,
        timestamp: Date.now(),
      }
      useOfflineStore.getState().enqueue(action)
      throw new axios.Cancel('Offline: request queued for later sync')
    } catch (e) {
      // If the offline store isn't available, fall through and let the
      // request fail naturally — don't swallow real errors.
      if (axios.isCancel(e)) throw e
    }
  }
  return config
})

// ── Refresh on 401, then retry once ───────────────────────────────────────
let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

const processQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token))
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const isAuthRequest = original?.url?.includes('/auth/')

    if (error.response?.status !== 401 || original._retry || isAuthRequest) {
      return Promise.reject(error)
    }

    // If already refreshing, queue this request.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) return reject(error)
          original.headers!.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true
    try {
      const refreshToken = await storage.getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
      const newAccess = data.accessToken as string
      const newRefresh = (data.refreshToken as string) ?? refreshToken

      await storage.setTokens(newAccess, newRefresh)
      processQueue(newAccess)

      original.headers!.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (e) {
      processQueue(null)
      await storage.clearTokens()
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export { BASE_URL }
