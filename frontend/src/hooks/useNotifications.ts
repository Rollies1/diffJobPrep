import { useEffect, useState, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService, NotificationPreferences } from '../services/notificationService';
import { useAuthStore } from '../store/useAuthStore';
import * as Haptics from 'expo-haptics';

// Push notifications disabled for Expo Go

export function useNotifications() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register token on auth
  useEffect(() => {
    if (!isAuthenticated) return;

    const setup = async () => {
      try {
        const token = await notificationService.registerPushToken();
        setPushToken(token);

        const prefs = await notificationService.getPreferences();
        setPreferences(prefs);

        // Schedule daily streak alert if enabled
        if (prefs.streakAlerts) {
          await notificationService.scheduleStreakAlert();
        }
      } catch (e) {
        console.warn('Push notifications not available:', e);
      }
    };

    setup();
  }, [isAuthenticated]);

  // Listen for incoming notifications (Mocked for Expo Go)
  useEffect(() => {
    return () => {};
  }, [router]);

  const scheduleReminder = useCallback(async (minutes: number = 30) => {
    return await notificationService.scheduleSessionReminder(minutes);
  }, []);

  const cancelAll = useCallback(async () => {
    await notificationService.cancelAllNotifications();
  }, []);

  const updatePrefs = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    Haptics.selectionAsync();
    await notificationService.updatePreferences(prefs);
    setPreferences((prev) => (prev ? { ...prev, ...prefs } : null));

    if (prefs.streakAlerts === false) {
      await cancelAll();
    } else if (prefs.streakAlerts === true) {
      await notificationService.scheduleStreakAlert();
    }
  }, [cancelAll]);

  return {
    pushToken,
    preferences,
    scheduleReminder,
    cancelAll,
    updatePrefs,
  };
}
