import apiClient from './apiClient';
import { eventBus } from '../utils/eventBus';
import { AxiosError } from 'axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
    onboardingComplete: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

// Improvement: Centralized error handling wrapper
const handleAuthError = (error: unknown) => {
  if (error instanceof AxiosError && error.response) {
    throw new Error(error.response.data?.message || 'Authentication failed');
  }
  throw error;
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return data;
    } catch (error) {
      return handleAuthError(error) as never;
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', credentials);
      return data;
    } catch (error) {
      return handleAuthError(error) as never;
    }
  },

  async me(): Promise<AuthResponse['user']> {
    const { data } = await apiClient.get<AuthResponse['user']>('/auth/me');
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors, we logout locally regardless
    } finally {
      eventBus.emit('auth:logout');
    }
  },

  // Used by apiClient interceptor for silent refresh
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data;
  },
};
