// @ts-nocheck
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from '../analytics/posthog';

const STREAK_REMINDER_HOUR = 20; // 8 PM local time
const REMINDER_ID_KEY = 'streak_reminder_notification_id';

class ReminderManager {
  async init() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      analytics.capture('notification_permission_denied');
      return false;
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });

    return true;
  }

  async scheduleStreakReminder(streak: number): Promise<string | null> {
    const hasPermission = await this.init();
    if (!hasPermission) return null;

    // Cancel existing reminder
    await this.cancelStreakReminder();

    const title = streak > 0 
      ? `🔥 ${streak}-day streak! Don't lose it!`
      : 'Ready for today\'s interview prep?';

    const body = streak > 0
      ? 'Practice for 5 minutes to keep your streak alive.'
      : 'A quick session today builds momentum for tomorrow.';

    const trigger = new Date();
    trigger.setHours(STREAK_REMINDER_HOUR);
    trigger.setMinutes(0);
    trigger.setSeconds(0);
    
    // If already past 8 PM, schedule for tomorrow
    if (trigger.getTime() < Date.now()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'streak_reminder', streak },
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: STREAK_REMINDER_HOUR,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(REMINDER_ID_KEY, identifier);
    analytics.capture('streak_reminder_scheduled', { streak, hour: STREAK_REMINDER_HOUR });
    
    return identifier;
  }

  async cancelStreakReminder() {
    const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await AsyncStorage.removeItem(REMINDER_ID_KEY);
    }
  }

  async cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(REMINDER_ID_KEY);
  }

  // Call this when user completes a session to update reminder
  async onSessionCompleted(streak: number) {
    // Reschedule for tomorrow
    await this.scheduleStreakReminder(streak);
    
    // Clear badge
    await Notifications.setBadgeCountAsync(0);
  }
}

export const reminderManager = new ReminderManager();
