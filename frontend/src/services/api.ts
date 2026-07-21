/**
 * Axios instance with JWT auth + automatic token refresh on 401.
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { Platform } from 'react-native'
import { storage } from './storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  android: 'http://10.0.2.2:8089/api/v1',
  ios: 'http://localhost:8089/api/v1',
  default: 'http://10.0.2.2:8089/api/v1',
}) as string

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach access token and device id on every request ──────────────────────
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

// ── Refresh on 401, then retry once ───────────────────────────
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

    if (error.response?.status !== 401 || original._retry) {
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
      // Navigate to login — your app should listen for a global event or
      // the auth store should expose a logout() you call here.
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export { BASE_URL }
