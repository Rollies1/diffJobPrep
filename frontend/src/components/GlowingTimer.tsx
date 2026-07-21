import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';

interface GlowingTimerProps {
  durationMs: number;
  isRunning?: boolean;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function GlowingTimer({ durationMs, isRunning = true, onComplete, size = 'md' }: GlowingTimerProps) {
  const theme = useTheme();
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (isRunning) {
      glowOpacity.value = withRepeat(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0.2);
    }
  }, [isRunning, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const displayTime = Math.ceil(durationMs / 1000);
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const dimensions = size === 'sm' ? 40 : size === 'md' ? 60 : 80;
  const fontSize = size === 'sm' ? 12 : size === 'md' ? 16 : 24;

  return (
    <View style={[styles.container, { width: dimensions, height: dimensions }]}>
      <Animated.View 
        style={[
          styles.glow, 
          glowStyle, 
          { 
            backgroundColor: isRunning ? theme.semantic.warning ?? theme.semantic.error : theme.semantic.info,
            borderRadius: dimensions / 2 
          }
        ]} 
      />
      <View style={[styles.innerCircle, { borderRadius: dimensions / 2, backgroundColor: theme.surface ?? theme.surfaceOverlay }]}>
        <Text style={[styles.text, { color: isRunning ? theme.text.primary : theme.text.secondary, fontSize }]}>
          {timeString}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  text: {
    fontFamily: 'Inter_700Bold',
  }
});
