import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { useDeviceTier } from '../../hooks/useDeviceTier';

interface BreathingGradientProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export const BreathingGradient: React.FC<BreathingGradientProps> = ({
  children,
  intensity = 'subtle',
}) => {
  const tier = useDeviceTier();
  const theme = useTheme();
  
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  // Use the theme's background as the base. 
  // Add a slightly tinted middle stop for depth.
  const gradientColors = [
    theme.background, 
    theme.isDark ? '#1a1a3e' : '#e2e8f0', 
    theme.surface
  ] as const;

  useEffect(() => {
    const duration = intensity === 'subtle' ? 8000 : intensity === 'medium' ? 5000 : 3000;
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [intensity, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Mid/low-end: static gradient, no animation
  if (tier !== 'high') {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            theme.isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)', 
            'transparent', 
            theme.isDark ? 'rgba(255,215,0,0.05)' : 'rgba(255,215,0,0.02)'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {children}
    </LinearGradient>
  );
};
