import React from 'react';
import { AppState, View, ActivityIndicator } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { useNotifications } from '../hooks/useNotifications';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { NetworkStatus } from '../components/NetworkStatus';
import { Toast } from '../components/Toast';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import { useSessionHeartbeat } from '../hooks/useSessionHeartbeat';

// React Query: refetch on app focus
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => subscription.remove();
});

function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNotifications();
  return <>{children}</>;
}

function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useOfflineSync();
  return <>{children}</>;
}

export const CoreProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bootstraps authentication, routing guards, and biometrics
  const { isReady } = useAppBootstrap();
  // Keeps session alive with backend
  useSessionHeartbeat();

  if (!isReady) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <OfflineSyncProvider>
      <NotificationProvider>
        <NetworkStatus />
        {/* @ts-expect-error missing props */}
      <Toast />
        {children}
      </NotificationProvider>
    </OfflineSyncProvider>
  );
};
