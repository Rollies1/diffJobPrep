import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';

export const biometricAuth = {
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  },

  async authenticate(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access JobPrep',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      return result.success;
    } catch {
      return false;
    }
  },

  async isEnabled(): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  },

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      const success = await this.authenticate();
      if (!success) throw new Error('Biometric authentication failed');
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    }
  },
};
