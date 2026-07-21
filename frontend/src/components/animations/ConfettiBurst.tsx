import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type ParticleShape = 'circle' | 'square' | 'line';

interface ParticleConfig {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  delay: number;
  duration: number;
}

interface ConfettiBurstProps {
  visible: boolean;
  particleCount?: number;
  origin?: { x: number; y: number };
  onComplete?: () => void;
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#8B5CF6'];

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  visible,
  particleCount = 40,
  origin = { x: 0, y: 0 },
  onComplete,
}) => {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);

  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = Math.random() * 360;
      const rad = (angle * Math.PI) / 180;
      return {
        id: i,
        x: Math.cos(rad),
        y: Math.sin(rad),
        angle,
        distance: 80 + Math.random() * 150,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        shape: (['circle', 'square', 'line'] as ParticleShape[])[i % 3],
        rotation: Math.random() * 360,
        delay: Math.random() * 300,
        duration: 800 + Math.random() * 600,
      };
    });
  }, [particleCount]);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(1500, withTiming(0, { duration: 400 }))
      );
      const timer = setTimeout(() => onComplete?.(), 1800);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (reducedMotion) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} collapsable={false}>
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} opacity={opacity} origin={origin} />
      ))}
    </View>
  );
};

const ConfettiParticle: React.FC<ParticleConfig & { opacity: Animated.SharedValue<number>; origin: { x: number; y: number } }> = ({
  x,
  y,
  distance,
  size,
  color,
  shape,
  rotation,
  delay,
  duration,
  opacity: parentOpacity,
  origin,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withTiming(x * distance, { duration, easing: Easing.outCubic })
    );
    translateY.value = withDelay(
      delay,
      withTiming(y * distance + 100, { duration, easing: Easing.outCubic }) // gravity
    );
    rotate.value = withDelay(
      delay,
      withTiming(rotation + 360, { duration: duration * 1.5, easing: Easing.linear })
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: duration - 100, easing: Easing.inCubic })
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: parentOpacity.value,
    width: size,
    height: shape === 'line' ? size * 3 : size,
    backgroundColor: color,
    borderRadius: shape === 'circle' ? size / 2 : shape === 'line' ? size / 4 : 2,
    position: 'absolute',
    left: '50%',
    top: '40%', // We can adjust this or use origin if needed
  }));

  return <Animated.View style={style} />;
};
