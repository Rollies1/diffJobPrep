import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { usePremiumEntrance } from '@/hooks/usePremiumEntrance';
import { FocusContainer } from '@/components/FocusContainer';
import { GlowingTimer } from '@/components/GlowingTimer';
import { Confetti } from '@/components/Confetti';
import { PremiumButton } from '@/components/PremiumButton';
import { PremiumCard } from '@/components/PremiumCard';
import { PremiumSkeleton } from '@/components/PremiumSkeleton';

export default function PracticeScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const router = useRouter();
  const theme = useTheme();
  
  const {
    status,
    currentQuestionIndex,
    totalQuestions,
    timeRemainingMs,
    currentDifficulty,
    start,
    submitAnswer,
    nextQuestion,
    complete,
    abandon,
    canSubmit,
    isLastQuestion,
  } = usePracticeSession();

  const [answerText, setAnswerText] = useState('');
  const headerStyle = usePremiumEntrance(0);
  const cardStyle = usePremiumEntrance(1);

  // Auto-start on mount if deckId provided
  useEffect(() => {
    if (deckId && status === 'idle') {
      start(deckId, { questionCount: 3, timeLimitMs: 120000 });
    }
  }, [deckId, status, start]);

  const handleSubmit = useCallback((correct: boolean) => {
    if (!answerText.trim() || !canSubmit) return;
    const durationMs = timeRemainingMs ? (120000 - timeRemainingMs) : 0;
    submitAnswer(answerText.trim(), durationMs, correct);
    setAnswerText('');
  }, [answerText, canSubmit, timeRemainingMs, submitAnswer]);

  const handleNext = useCallback(async () => {
    if (isLastQuestion) {
      await complete();
    } else {
      await nextQuestion();
    }
  }, [isLastQuestion, complete, nextQuestion]);

  // ─── Idle / Loading ───────────────────────────────────
  if (status === 'idle' || status === 'loading') {
    return (
      <FocusContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <PremiumSkeleton height={200} borderRadius={24} />
          <View style={{ marginTop: 16 }}>
            <PremiumSkeleton height={20} width={150} borderRadius={8} />
          </View>
        </View>
      </FocusContainer>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (status === 'error') {
    return (
      <FocusContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: theme.semantic.error }}>
            Failed to start session
          </Text>
          <PremiumButton title="Retry" onPress={() => start(deckId!)} style={{ width: '100%' }} />
        </View>
      </FocusContainer>
    );
  }

  // ─── Reviewing (answer submitted, show next/complete) ─
  if (status === 'reviewing') {
    return (
      <FocusContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Confetti active={true} particleCount={30} />
          
          <View
            style={{
              width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
              backgroundColor: `${theme.semantic.success}20`, borderWidth: 2, borderColor: `${theme.semantic.success}40`
            }}
          >
            <Text style={{ fontSize: 30, color: theme.semantic.success }}>✓</Text>
          </View>
          
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: theme.text.primary }}>
            {isLastQuestion ? 'Session Complete!' : 'Answer Recorded'}
          </Text>
          
          <Text style={{ fontSize: 16, marginBottom: 32, color: theme.text.secondary, textAlign: 'center' }}>
            {isLastQuestion 
              ? 'Great work! Ready to see your results?'
              : 'Ready for the next question?'}
          </Text>
          
          <PremiumButton
            title={isLastQuestion ? 'Finish' : 'Next Question'}
            onPress={handleNext}
            style={{ width: '100%' }}
          />
        </View>
      </FocusContainer>
    );
  }

  // ─── Completed ────────────────────────────────────────
  if (status === 'completed') {
    return (
      <FocusContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Confetti active={true} particleCount={50} />
          
          <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 16, color: theme.text.primary }}>
            Session Complete!
          </Text>
          
          <PremiumButton title="Back to Library" onPress={() => router.back()} style={{ width: '100%' }} />
        </View>
      </FocusContainer>
    );
  }

  // ─── In Progress ──────────────────────────────────────
  return (
    <FocusContainer intensity="deep">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}
      >
        {/* Header */}
        <Animated.View style={[headerStyle, { marginBottom: 24 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: theme.text.muted }}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {currentDifficulty && (
                <View style={{ 
                  backgroundColor: currentDifficulty === 'HARD' ? `${theme.semantic.error}20` : 
                                   currentDifficulty === 'EASY' ? `${theme.semantic.success}20` : 
                                   `${theme.semantic.info}20`,
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
                  borderColor: currentDifficulty === 'HARD' ? `${theme.semantic.error}40` : 
                               currentDifficulty === 'EASY' ? `${theme.semantic.success}40` : 
                               `${theme.semantic.info}40`
                }}>
                  <Text style={{ 
                    fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase',
                    color: currentDifficulty === 'HARD' ? theme.semantic.error : 
                           currentDifficulty === 'EASY' ? theme.semantic.success : 
                           theme.semantic.info
                  }}>
                    {currentDifficulty}
                  </Text>
                </View>
              )}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.semantic.info }}>
                FOCUS
              </Text>
            </View>
          </View>
          
          {timeRemainingMs !== null && (
            <GlowingTimer
              durationMs={timeRemainingMs}
              isRunning={status === 'in_progress'}
              size="lg"
            />
          )}
        </Animated.View>

        {/* Question Card */}
        <Animated.View style={[cardStyle, { flex: 1, marginBottom: 16 }]}>
          <PremiumCard style={{ padding: 24, flex: 1, justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', lineHeight: 32, marginBottom: 16, color: theme.text.primary }}>
                {/* In real app, fetch question content from store or query */}
                Design a URL shortener like Bitly. How would you handle 10M requests per day?
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: theme.text.secondary }}>
                <Text style={{ color: theme.semantic.info, fontWeight: 'bold' }}>Hint: </Text>
                Consider database sharding, caching, and base62 encoding.
              </Text>
            </View>

            <TextInput
              style={{
                marginTop: 24,
                borderRadius: 12,
                borderWidth: 1,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                minHeight: 120,
                backgroundColor: theme.surfaceOverlay,
                borderColor: theme.border,
                color: theme.text.primary,
                textAlignVertical: 'top',
              }}
              placeholder="Type your answer here..."
              placeholderTextColor={theme.text.muted}
              multiline
              value={answerText}
              onChangeText={setAnswerText}
              accessibilityLabel="Answer input"
            />
          </PremiumCard>
        </Animated.View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PremiumButton
              title="✓ Got It"
              onPress={() => handleSubmit(true)}
              disabled={!answerText.trim() || !canSubmit}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PremiumButton
              title="✗ Missed"
              onPress={() => handleSubmit(false)}
              variant="ghost"
              disabled={!answerText.trim() || !canSubmit}
            />
          </View>
          <PremiumButton
            title="Abandon"
            onPress={abandon}
            variant="ghost"
          />
        </View>
      </KeyboardAvoidingView>
    </FocusContainer>
  );
}
