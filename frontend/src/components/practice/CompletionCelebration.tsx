// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../../hooks/useHaptics';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme/ThemeProvider';
import { LottiePlayer } from '../animations/LottiePlayer';
import { ConfettiBurst } from '../animations/ConfettiBurst';
import { StreakFlame } from './StreakFlame';

interface CompletionCelebrationProps {
  visible: boolean;
  deckTitle: string;
  questionsAnswered: number;
  correctCount: number;
  streak: number;
  bestStreak: number;
  onContinue: () => void;
  onShare: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  visible,
  deckTitle,
  questionsAnswered,
  correctCount,
  streak,
  bestStreak,
  onContinue,
  onShare,
}) => {
  const haptics = useHaptics();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      haptics.hapticSuccess();
      // Stagger: Lottie first, then confetti
      const timer = setTimeout(() => setShowConfetti(true), reducedMotion ? 0 : 400);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [visible, reducedMotion]);

  if (!visible) return null;

  const accuracy = questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ConfettiBurst visible={showConfetti} particleCount={50} />
      
      <View style={styles.content}>
        {/* Lottie Trophy Animation */}
        <View style={styles.lottieContainer}>
          <LottiePlayer
            // We use a mock source here since we don't have the actual .lottie file in this repo.
            // Using a require to a non-existent file will throw in Metro, so we use the placeholder immediately.
            source={null}
            autoPlay
            loop={false}
            style={styles.lottie}
            placeholder={
              <View style={styles.placeholder}>
                <Ionicons name="trophy" size={80} color={theme.premium.gold} />
              </View>
            }
          />
        </View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.stats}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Session Complete!</Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{deckTitle}</Text>

          <View style={styles.statGrid}>
            <StatBox
              icon="checkmark-circle"
              value={`${accuracy}%`}
              label="Accuracy"
              color={theme.semantic.success}
              themeColors={colors}
            />
            <StatBox
              icon="chatbubbles"
              value={String(questionsAnswered)}
              label="Questions"
              color={theme.semantic.info}
              themeColors={colors}
            />
            <StatBox
              icon="time"
              value="12m" // Calculate from session timer in production
              label="Duration"
              color={theme.premium.purple}
              themeColors={colors}
            />
          </View>

          <View style={styles.streakRow}>
            <StreakFlame streak={streak} bestStreak={bestStreak} size="lg" />
            {streak > bestStreak && (
              <View style={[styles.newBestBadge, { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.15)' }]}>
                <Text style={[styles.newBestText, { color: theme.premium.gold }]}>NEW BEST!</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.actions}>
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.premium.gold },
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue to next session"
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" style={{ marginLeft: 8 }} />
          </Pressable>

          <Pressable
            onPress={onShare}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share your progress"
          >
            <Ionicons name="share-outline" size={18} color={theme.text.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.text.primary }]}>Share Progress</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const StatBox: React.FC<{
  icon: string;
  value: string;
  label: string;
  color: string;
  themeColors: any;
}> = ({ icon, value, label, color, themeColors }) => (
  <View style={[styles.statBox, { backgroundColor: themeColors.surface.main, borderColor: themeColors.surface.glassBorder }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color: themeColors.text.primary }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: themeColors.text.muted }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lottieContainer: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  newBestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  newBestText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
