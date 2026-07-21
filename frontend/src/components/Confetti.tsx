import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

interface ConfettiProps {
  active: boolean;
  particleCount?: number;
}

const COLORS = ['#FF4C4C', '#FFD700', '#4CAF50', '#00BCD4', '#9C27B0'];

const Particle = ({ delay }: { delay: number }) => {
  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(1);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const left = Math.random() * windowWidth;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(windowHeight, { duration: 3000, easing: Easing.linear })
    );
    opacity.value = withDelay(
      delay + 2000,
      withTiming(0, { duration: 1000 })
    );
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.particle, { left, backgroundColor: color }, style]} />;
};

export function Confetti({ active, particleCount = 30 }: ConfettiProps) {
  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: particleCount }).map((_, i) => (
        <Particle key={i} delay={Math.random() * 500} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 16,
    borderRadius: 4,
  },
});
