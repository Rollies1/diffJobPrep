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
import { StreakFlame } from '../../../src/components/practice/StreakFlame';
import { useHaptics } from '../../../src/hooks/useHaptics';
import { useSessionTokens } from '../../../src/hooks/useSessionTokens';
import { usePremiumStatus } from '../../../src/hooks/usePremiumStatus';
import { offlineDB } from '../../../src/offline/database';
import { analytics } from '../../../src/analytics/posthog';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import PracticeSetupScreen, { type PracticeConfig } from '../../../src/screens/PracticeSetupScreen';
import CompletionCelebrationScreen from '../../../src/screens/CompletionCelebrationScreen';
import { questionService } from '../../../src/services/questions';
import type { QuestionDto, SessionResult } from '../../../src/types/api';

interface Question {
  id: string;
  question_text: string;
  answer_guidance: string;
  difficulty: string;
}

interface QuestionSlot {
  questionId: string;
  questionText: string;
  expectedKeywords?: string[];
}

type Phase = 'setup' | 'loading' | 'in_progress' | 'complete' | 'empty' | 'error';

export default function PracticeScreen() {
  const haptics = useHaptics();
  const theme = useTheme();
  const c = useThemeColors();
  const { tokens, consumeToken, maxTokens } = useSessionTokens();
  const { isPremium } = usePremiumStatus();
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();

  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(3); // Load from storage in production
  const [bestStreak] = useState(5);
  const [activeDeckId, setActiveDeckId] = useState<string>(deckId ?? 'random');
  const [activeDeckTitle, setActiveDeckTitle] = useState<string>('Practice session');
  const [mode, setMode] = useState<'QUICK' | 'MOCK'>('QUICK');
  // Synthesized SessionResult for the CompletionCelebrationScreen; populated
  // when the user finishes the last question.
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loadError, setLoadError] = useState<string>('');
  // Last config used by startSession — drives the "Retry" button on the
  // error state so a flaky network can be retried without re-running the
  // wizard.
  const [lastConfig, setLastConfig] = useState<PracticeConfig | null>(null);

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

  // ── Question fetching helpers ─────────────────────────────────
  // The backend `/questions/random` endpoint expects a categoryId UUID
  // (which the frontend doesn't have for arbitrary category names), so the
  // strategy is:
  //   (a) Random mix (no category, no deckId) → /questions/random?count=
  //   (b) category chosen                     → fetch /questions/decks,
  //                                            filter by category, pick a
  //                                            random deck, fetch its
  //                                            questions via /questions/decks/{id}/questions,
  //                                            filter by difficulty, slice to count
  //   (c) deckId provided (from library)      → fetch that deck's questions,
  //                                            filter by difficulty, slice to count
  // Always fall back to /questions/random?count= if the chosen path returns
  // empty, so the user never sees an infinite spinner.

  /** Page through /questions/decks/{id}/questions until nextCursor is null. */
  const fetchAllFromDeck = useCallback(async (targetDeckId: string): Promise<QuestionDto[]> => {
    const all: QuestionDto[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 50; i++) {
      const page = await questionService.getQuestions(targetDeckId, cursor, 100);
      all.push(...page.data);
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
    return all;
  }, []);

  /** Map /questions/random slots into the local Question[] shape. */
  const mapSlots = useCallback(
    (slots: QuestionSlot[], config: PracticeConfig): Question[] =>
      slots.map((s) => ({
        id: s.questionId,
        question_text: s.questionText,
        answer_guidance: '',
        difficulty: config.difficulty === 'ADAPTIVE' ? 'MEDIUM' : config.difficulty,
      })),
    [],
  );

  /** Map full QuestionDto[] (from deck fetch) into the local Question[] shape. */
  const mapDtos = useCallback(
    (dtos: QuestionDto[]): Question[] =>
      dtos.map((q) => ({
        id: q.id,
        question_text: q.content || q.title,
        answer_guidance: q.hint || '',
        difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
      })),
    [],
  );

  const filterByDifficulty = (qs: QuestionDto[], difficulty?: string): QuestionDto[] => {
    if (!difficulty) return qs;
    return qs.filter((q) => (q.difficulty || '').toUpperCase() === difficulty);
  };

  /**
   * Resolve a PracticeConfig into a concrete list of questions, applying
   * the (a)/(b)/(c) strategy above and falling back to /questions/random
   * if the primary path returns empty. Throws if even the fallback fails —
   * callers catch and render the error phase.
   */
  const fetchQuestionsForConfig = useCallback(
    async (config: PracticeConfig): Promise<Question[]> => {
      const difficulty = config.difficulty === 'ADAPTIVE' ? undefined : config.difficulty;
      const count = config.questionCount;

      // (c) deckId provided (from library)
      if (config.deckId) {
        try {
          const slots = await questionService.getRandomQuestions({ deckId: config.deckId, difficulty, count });
          if (slots.length > 0) return mapSlots(slots, config);
        } catch {
          // fall through to the deck-pagination path
        }
        try {
          const qs = await fetchAllFromDeck(config.deckId);
          const filtered = filterByDifficulty(qs, difficulty);
          if (filtered.length > 0) return mapDtos(filtered.slice(0, count));
        } catch {
          // fall through to the all-random fallback
        }
        const random = await questionService.getRandomQuestions({ count });
        return mapSlots(random, config);
      }

      // (a) Random mix (no category, no deckId)
      if (!config.category) {
        try {
          const slots = await questionService.getRandomQuestions({ difficulty, count });
          if (slots.length > 0) return mapSlots(slots, config);
        } catch {
          // fall through to the unfiltered all-random fallback
        }
        const random = await questionService.getRandomQuestions({ count });
        return mapSlots(random, config);
      }

      // (b) category chosen → pick a random deck in that category
      try {
        const decks = await questionService.getDecks();
        const matching = decks.filter((d) => d.category === config.category);
        if (matching.length > 0) {
          const shuffled = [...matching].sort(() => Math.random() - 0.5);
          for (const deck of shuffled) {
            try {
              const qs = await fetchAllFromDeck(deck.id);
              const filtered = filterByDifficulty(qs, difficulty);
              if (filtered.length > 0) {
                return mapDtos(filtered.slice(0, count));
              }
            } catch {
              // try the next matching deck
            }
          }
        }
      } catch {
        // fall through to the all-random fallback
      }

      // Final fallback: random across all
      try {
        const slots = await questionService.getRandomQuestions({ difficulty, count });
        if (slots.length > 0) return mapSlots(slots, config);
      } catch {
        // last-ditch attempt below
      }
      const random = await questionService.getRandomQuestions({ count });
      return mapSlots(random, config);
    },
    [fetchAllFromDeck, mapSlots, mapDtos],
  );

  /**
   * Kick off a session from the setup screen. Replaces the legacy
   * `startSession('QUICK' | 'MOCK')` which pulled from the empty offline
   * SQLite cache and infinite-loaded.
   *
   * Flow: set the loading phase → fetch real questions via the backend →
   * on success transition to in_progress; on empty result transition to
   * the empty state; on thrown error transition to the error state.
   */
  const startSession = useCallback(
    async (config: PracticeConfig) => {
      // Inject route-supplied deckId if the wizard didn't set one (e.g.
      // user navigated here from the Library with ?deckId=...).
      const effectiveConfig: PracticeConfig = { ...config, deckId: config.deckId ?? deckId };
      setLastConfig(effectiveConfig);
      setMode(effectiveConfig.mode);
      setActiveDeckId(effectiveConfig.deckId ?? effectiveConfig.category ?? 'random');
      setActiveDeckTitle(
        effectiveConfig.deckId
          ? 'Deck practice'
          : effectiveConfig.category
            ? `${effectiveConfig.category} practice`
            : 'Random mix practice',
      );
      setPhase('loading');
      setLoadError('');

      try {
        const qs = await fetchQuestionsForConfig(effectiveConfig);
        if (qs.length === 0) {
          setPhase('empty');
          return;
        }
        setQuestions(qs);
        setCurrentIndex(0);
        setCorrectCount(0);
        setShowSuccess(false);
        setSessionStartTime(Date.now());
        setPhase('in_progress');
        analytics.sessionStarted(effectiveConfig.deckId ?? effectiveConfig.category ?? 'random', false);
      } catch (e: any) {
        setLoadError(e?.message ?? 'Failed to load questions');
        setPhase('error');
      }
    },
    [fetchQuestionsForConfig, deckId],
  );

  const handleAnswer = useCallback(() => {
    haptics.hapticSuccess();
    setShowSuccess(true);
    setCorrectCount((prev) => prev + 1);

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
      const durationMs = Date.now() - sessionStartTime;
      const duration = Math.floor(durationMs / 1000);
      analytics.sessionCompleted(activeDeckId, questions.length, duration);
      setStreak((prev) => prev + 1);
      // Synthesize a SessionResult for the CompletionCelebrationScreen.
      const total = questions.length;
      const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      setResult({
        sessionId: 'local-' + Date.now(),
        score,
        totalQuestions: total,
        answeredQuestions: total,
        correctAnswers: correctCount,
        durationMs,
        skillBreakdown: {},
      });
      setPhase('complete');
      return;
    }

    setCurrentIndex((i) => i + 1);
  }, [currentIndex, questions.length, sessionStartTime, activeDeckId, correctCount]);

  const handlePracticeAgain = useCallback(() => {
    setResult(null);
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setShowSuccess(false);
    setPhase('setup');
  }, []);

  const handleHome = useCallback(() => {
    router.replace('/(app)/dashboard');
  }, [router]);

  const handleBackToSetup = useCallback(() => {
    setQuestions([]);
    setLoadError('');
    setPhase('setup');
  }, []);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      startSession(lastConfig);
    } else {
      setPhase('setup');
    }
  }, [lastConfig, startSession]);

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
    return <PracticeSetupScreen onStart={startSession} onTab={handleSetupTab} />;
  }

  // ── Loading phase: real spinner while we hit the backend ──
  if (phase === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.blue} size="large" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.ink, marginTop: 16 }}>Loading questions…</Text>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}>Fetching from your library</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty state: no questions matched the filters ─────────
  if (phase === 'empty') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: c.ink, marginTop: 16, textAlign: 'center' }}>
            No questions found
          </Text>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 8, textAlign: 'center' }}>
            No questions found for those filters. Try a different category or difficulty.
          </Text>
          <Pressable
            onPress={handleBackToSetup}
            style={({ pressed }) => [
              {
                marginTop: 24,
                height: 48,
                borderRadius: 16,
                paddingHorizontal: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.blue,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Back to setup</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state: network failure / 5xx / etc. ─────────────
  if (phase === 'error') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48 }}>📡</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: c.ink, marginTop: 16, textAlign: 'center' }}>
            Couldn&apos;t load questions
          </Text>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 8, textAlign: 'center' }}>
            {loadError || 'Something went wrong. Please check your connection and try again.'}
          </Text>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              {
                marginTop: 24,
                height: 48,
                borderRadius: 16,
                paddingHorizontal: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.blue,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Retry</Text>
          </Pressable>
          <Pressable
            onPress={handleBackToSetup}
            style={({ pressed }) => [{ marginTop: 12, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.textMuted }}>Back to setup</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Complete phase: wire the previously-orphan ────────────
  // CompletionCelebrationScreen into the main flow with a synthesized
  // SessionResult. onPracticeAgain returns to setup; onHome replaces with
  // the dashboard route.
  if (phase === 'complete' && result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
        <CompletionCelebrationScreen
          result={result}
          deckTitle={activeDeckTitle}
          onPracticeAgain={handlePracticeAgain}
          onHome={handleHome}
        />
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Safety net — should never trigger once phase is 'in_progress' because
  // startSession gates the transition on qs.length > 0.
  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.semantic.info} style={{ marginTop: 64 }} />
        <Text style={[styles.loadingText, { color: theme.text.primary }]}>Loading questions...</Text>
      </SafeAreaView>
    );
  }

  // ── In-progress phase: per-question loop (unchanged) ──────
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
