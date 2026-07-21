import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';

interface PremiumSkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
}

export function PremiumSkeleton({ width = '100%', height, borderRadius = 8 }: PremiumSkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        animatedStyle,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  }
});
