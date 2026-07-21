import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

export function usePremiumEntrance(index: number = 0) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * 100, withSpring(0, { damping: 15, stiffness: 100 }));
    opacity.value = withDelay(index * 100, withSpring(1, { damping: 15 }));
  }, [index, translateY, opacity]);

  return useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
}
