import { api } from './api'
import * as storage from './storage'
import { Platform } from 'react-native'

export interface RegisterDeviceRequest {
  token: string
  platform: 'android' | 'ios'
  deviceId: string
}

export const notificationsService = {
  /** Register the Expo push token with the backend. */
  register: async (token: string): Promise<void> => {
    const deviceId = await storage.getDeviceId()
    const body: RegisterDeviceRequest = {
      token,
      platform: Platform.OS as 'android' | 'ios',
      deviceId,
    }
    await api.post('/notifications/register', body)
  },

  /** Unregister (e.g., on logout). */
  unregister: async (token: string): Promise<void> => {
    await api.delete('/notifications/register', { data: { token } })
  },
}
