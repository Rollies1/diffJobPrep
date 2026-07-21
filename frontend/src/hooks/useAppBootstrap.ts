import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { useAppState } from './useAppState';
import { eventBus } from '../utils/eventBus';
import { biometricAuth } from '../utils/biometricAuth';
import { useQueryClient } from '@tanstack/react-query';

export const useAppBootstrap = () => {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isHydrated = useAuthStore(s => s.isHydrated);
  const logout = useAuthStore(s => s.logout);
  const queryClient = useQueryClient();

  // AppState manager for active/background hooks
  useAppState();

  // 1. Auth restoration + biometric gate
  useEffect(() => {
    const init = async () => {
      try {
        if (isAuthenticated) {
          const biometricEnabled = await biometricAuth.isEnabled();
          if (biometricEnabled) {
            const success = await biometricAuth.authenticate();
            if (!success) {
              await logout();
            }
          }
        }
      } catch (e) {
        console.error('Initialization error', e);
      }
    };

    if (isHydrated) {
      init();
    }
  }, [isHydrated]);

  // 2. Route guarding
  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/dashboard');
    }
  }, [isHydrated, isAuthenticated, segments]);

  // 3. Global error/logout handler
  useEffect(() => {
    const unsubscribe = eventBus.on('auth:logout', () => {
      queryClient.clear();
      logout();
      router.replace('/(auth)/login');
    });

    return unsubscribe;
  }, [router, queryClient, logout]);

  return { isReady: isHydrated };
};
