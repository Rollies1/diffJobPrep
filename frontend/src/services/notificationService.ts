export interface NotificationPreferences {
  sessionReminders: boolean;
  streakAlerts: boolean;
  newContent: boolean;
  marketing: boolean;
}

export const notificationService = {
  async registerPushToken(): Promise<string | null> {
    console.log('Push notifications disabled in Expo Go');
    return null;
  },

  async unregisterPushToken(): Promise<void> {},

  async scheduleSessionReminder(minutesBefore: number = 30): Promise<string> {
    return 'mock-id';
  },

  async scheduleStreakAlert(hour: number = 20, minute: number = 0): Promise<string> {
    return 'mock-id';
  },

  async cancelAllNotifications(): Promise<void> {},

  async getPreferences(): Promise<NotificationPreferences> {
    return {
      sessionReminders: true,
      streakAlerts: true,
      newContent: false,
      marketing: false,
    };
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {},
};
