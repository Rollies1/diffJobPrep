import { api } from './api'
import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UserDto,
} from '../types/api'

export const authService = {
  register: async (body: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', body)
    return data
  },

  login: async (body: LoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', body)
    return data
  },

  me: async (): Promise<UserDto> => {
    const { data } = await api.get<UserDto>('/auth/me')
    return data
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken })
    return data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },
}
