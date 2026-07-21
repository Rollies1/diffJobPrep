import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme/ThemeProvider';

interface StreakFlameProps {
  streak: number;
  bestStreak?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakFlame: React.FC<StreakFlameProps> = ({
  streak,
  bestStreak = 0,
  size = 'md',
}) => {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const sizes = {
    sm: { container: 32, icon: 16, font: 13 },
    md: { container: 44, icon: 22, font: 15 },
    lg: { container: 56, icon: 28, font: 18 },
  };

  const s = sizes[size];

  useEffect(() => {
    if (reducedMotion) return;
    
    // Gentle breathing for active streak
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.2, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const isActive = streak > 0;
  const isBest = streak >= bestStreak && bestStreak > 0;

  return (
    <View style={styles.container}>
      <View style={[
        styles.flameContainer,
        { width: s.container, height: s.container },
        isActive && styles.flameContainerActive
      ]}>
        {isActive && !reducedMotion && (
          <Animated.View style={[
            styles.glow,
            glowStyle,
            { width: s.container * 1.5, height: s.container * 1.5, borderRadius: (s.container * 1.5) / 2 }
          ]} />
        )}
        
        <Animated.View style={isActive ? animatedStyle : undefined}>
          <Ionicons
            name="flame"
            size={s.icon}
            color={isActive ? (isBest ? theme.premium.gold : '#FF6B6B') : theme.text.muted}
          />
        </Animated.View>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.streakCount, { fontSize: s.font, color: isActive ? theme.text.primary : theme.text.muted }]}>
          {streak}
        </Text>
        <Text style={[styles.streakLabel, { color: theme.text.muted }]}>
          {streak === 1 ? 'day' : 'days'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flameContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  flameContainerActive: {
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderColor: 'rgba(255,107,107,0.15)',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,107,107,0.2)',
    alignSelf: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  streakCount: {
    fontWeight: '800',
    lineHeight: 20,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
  },
});
