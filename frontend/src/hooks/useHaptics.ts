import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const hapticSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const hapticError = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const hapticSelection = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const hapticPurchase = useCallback(() => {
    // Heavy impact for premium conversion
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const hapticLock = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  return { hapticSuccess, hapticError, hapticSelection, hapticPurchase, hapticLock };
}
