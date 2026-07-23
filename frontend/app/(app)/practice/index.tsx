import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SuccessBurst } from '../../../src/components/animations/SuccessBurst';
import { CompletionCelebration } from '../../../src/components/practice/CompletionCelebration';
import { StreakFlame } from '../../../src/components/practice/StreakFlame';
import { useHaptics } from '../../../src/hooks/useHaptics';
import { useSessionTokens } from '../../../src/hooks/useSessionTokens';
import { usePremiumStatus } from '../../../src/hooks/usePremiumStatus';
import { offlineDB } from '../../../src/offline/database';
import { analytics } from '../../../src/analytics/posthog';
import { useTheme } from '../../../src/theme/ThemeProvider';
import PracticeSetupScreen from '../../../src/screens/PracticeSetupScreen';

interface Question {
  id: string;
  question_text: string;
  answer_guidance: string;
  difficulty: string;
}

type Phase = 'setup' | 'in_progress';

export default function PracticeScreen() {
  const haptics = useHaptics();
  const theme = useTheme();
  const { tokens, consumeToken, maxTokens } = useSessionTokens();
  const { isPremium } = usePremiumStatus();
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();

  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(3); // Load from storage in production
  const [bestStreak] = useState(5);
  const [activeDeckId, setActiveDeckId] = useState<string>(deckId ?? 'behavioral_basics');
  const [activeDeckTitle, setActiveDeckTitle] = useState<string>('Practice session');
  const [mode, setMode] = useState<'QUICK' | 'MOCK'>('QUICK');

  const tokenWidth = useSharedValue(100);

  useEffect(() => {
    analytics.screen('practice');
  }, []);

  useEffect(() => {
    tokenWidth.value = withSpring((tokens / maxTokens) * 100, { damping: 15 });
  }, [tokens]);

  const tokenBarStyle = useAnimatedStyle(() => ({
    width: `${tokenWidth.value}%`,
  }));

  // Kick off a session from the setup screen. `nextMode` selects QUICK vs MOCK;
  // both flow into the same per-question loop, but MOCK is tracked for analytics.
  const startSession = useCallback(
    async (nextMode: 'QUICK' | 'MOCK') => {
      const targetDeck = deckId ?? 'behavioral_basics';
      const qs = await offlineDB.getQuestionsForDeck(targetDeck);
      setMode(nextMode);
      setActiveDeckId(targetDeck);
      setActiveDeckTitle(targetDeck === 'behavioral_basics' ? 'Behavioral Basics' : 'Practice session');
      setQuestions(qs);
      setCurrentIndex(0);
      setCorrectCount(0);
      setShowSuccess(false);
      setShowCompletion(false);
      setSessionStartTime(Date.now());
      setPhase('in_progress');
      analytics.sessionStarted(targetDeck, false);
    },
    [deckId],
  );

  const handleAnswer = useCallback(() => {
    haptics.hapticSuccess();
    setShowSuccess(true);
    setCorrectCount((c) => c + 1);

    if (!isPremium) {
      consumeToken();
    }

    const currentQuestion = questions[currentIndex];
    if (currentQuestion) {
      offlineDB.updateProgress(currentQuestion.id, activeDeckId, 'attempted');
    }
  }, [isPremium, consumeToken, questions, currentIndex, activeDeckId, haptics]);

  const handleNext = useCallback(() => {
    setShowSuccess(false);

    if (currentIndex >= questions.length - 1) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      analytics.sessionCompleted(activeDeckId, questions.length, duration);
      setStreak((s) => s + 1);
      setShowCompletion(true);
      return;
    }

    setCurrentIndex((i) => i + 1);
  }, [currentIndex, questions.length, sessionStartTime, activeDeckId]);

  const handleContinue = useCallback(() => {
    setShowCompletion(false);
    setPhase('setup');
    setCurrentIndex(0);
    setCorrectCount(0);
  }, []);

  const handleSetupTab = useCallback(
    (key: string) => {
      if (key === 'practice') return;
      const map: Record<string, string> = {
        home: '/(app)/dashboard',
        library: '/(app)/library',
        tutor: '/(app)/tutor',
        profile: '/(app)/profile',
      };
      if (map[key]) router.push(map[key]);
    },
    [router],
  );

  // ── Setup phase: PracticeSetupScreen ──────────────────────
  if (phase === 'setup') {
    return (
      <PracticeSetupScreen
        onStartQuick={() => startSession('QUICK')}
        onStartMock={() => startSession('MOCK')}
        onTab={handleSetupTab}
      />
    );
  }

  const currentQuestion = questions[currentIndex];

  if (showCompletion) {
    return (
      <CompletionCelebration
        visible={true}
        deckTitle={activeDeckTitle}
        questionsAnswered={questions.length}
        correctCount={correctCount}
        streak={streak}
        bestStreak={bestStreak}
        onContinue={handleContinue}
        onShare={() => analytics.capture('progress_shared', { deck_id: activeDeckId, mode })}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.semantic.info} style={{ marginTop: 64 }} />
        <Text style={[styles.loadingText, { color: theme.text.primary }]}>Loading questions...</Text>
      </SafeAreaView>
    );
  }

  // ── In-progress phase: per-question loop ──────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setPhase('setup')}
          accessibilityLabel="Back to practice setup"
          accessibilityRole="button"
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <StreakFlame streak={streak} bestStreak={bestStreak} size="sm" />
        </View>

        <View style={styles.tokenContainer}>
          <Ionicons name="flash" size={14} color={theme.premium.gold} />
          <View style={styles.tokenTrack}>
            <Animated.View style={[styles.tokenFill, tokenBarStyle, { backgroundColor: theme.premium.gold }]} />
          </View>
          <Text style={[styles.tokenText, { color: theme.text.secondary }]}>{tokens}/{maxTokens}</Text>
        </View>
      </View>

      {/* Mode badge + Question Counter */}
      <View style={styles.counterRow}>
        <Text style={[styles.counter, { color: theme.text.muted }]}>
          {mode === 'MOCK' ? 'MOCK · ' : ''}Question {currentIndex + 1} of {questions.length}
        </Text>
        <View style={styles.difficultyBadge}>
          <Text style={[styles.difficultyText, { color: theme.semantic.info }]}>{currentQuestion.difficulty}</Text>
        </View>
      </View>

      {/* Question */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.questionText, { color: theme.text.primary }]}>{currentQuestion.question_text}</Text>
            {currentQuestion.answer_guidance && (
              <View style={styles.guidanceBox}>
                <Ionicons name="bulb" size={16} color={theme.premium.gold} />
                <Text style={[styles.guidanceText, { color: theme.text.secondary }]}>{currentQuestion.answer_guidance}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionArea}>
        <Pressable
          onPress={handleAnswer}
          style={({ pressed }) => [
            styles.answerButton,
            { backgroundColor: theme.semantic.info },
            pressed && styles.buttonPressed,
          ]}
          accessibilityLabel="Submit answer"
          accessibilityRole="button"
        >
          <Text style={styles.answerButtonText}>Submit Answer</Text>
        </Pressable>

        {showSuccess && (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              { backgroundColor: theme.semantic.success },
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel="Next question"
            accessibilityRole="button"
          >
            <Text style={styles.nextButtonText}>
              {currentIndex >= questions.length - 1 ? 'Finish Session' : 'Next →'}
            </Text>
          </Pressable>
        )}
      </View>

      <SuccessBurst visible={showSuccess} onComplete={() => undefined} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: 8,
  },
  tokenTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  tokenFill: {
    height: '100%',
    borderRadius: 9999,
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  questionCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  questionText: {
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 16,
  },
  guidanceBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    gap: 8,
  },
  guidanceText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionArea: {
    marginTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  answerButton: {
    height: 56,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    height: 56,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  answerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
