import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

interface Question {
  id: string;
  question_text: string;
  answer_guidance: string;
  difficulty: string;
}

export default function PracticeScreen() {
  const haptics = useHaptics();
  const theme = useTheme();
  const { tokens, consumeToken, maxTokens } = useSessionTokens();
  const { isPremium } = usePremiumStatus();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(3); // Load from storage in production
  const [bestStreak] = useState(5);
  
  const tokenWidth = useSharedValue(100);

  const deckId = 'behavioral_basics'; // From route params

  useEffect(() => {
    loadQuestions();
    analytics.screen('practice');
  }, []);

  useEffect(() => {
    tokenWidth.value = withSpring((tokens / maxTokens) * 100, { damping: 15 });
  }, [tokens]);

  const loadQuestions = async () => {
    const qs = await offlineDB.getQuestionsForDeck(deckId);
    setQuestions(qs);
  };

  const tokenBarStyle = useAnimatedStyle(() => ({
    width: `${tokenWidth.value}%`,
  }));

  const handleAnswer = useCallback(() => {
    haptics.hapticSuccess(); // Use hapticSuccess instead of success
    setShowSuccess(true);
    setCorrectCount(c => c + 1);
    
    if (!isPremium) {
      consumeToken();
    }
    
    const currentQuestion = questions[currentIndex];
    if (currentQuestion) {
      offlineDB.updateProgress(currentQuestion.id, deckId, 'attempted');
    }
  }, [isPremium, consumeToken, questions, currentIndex]);

  const handleNext = useCallback(() => {
    setShowSuccess(false);
    
    if (currentIndex >= questions.length - 1) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      analytics.sessionCompleted(deckId, questions.length, duration);
      setShowCompletion(true);
      return;
    }
    
    setCurrentIndex(i => i + 1);
  }, [currentIndex, questions.length, sessionStartTime]);

  const handleContinue = useCallback(() => {
    setShowCompletion(false);
    setCurrentIndex(0);
    setCorrectCount(0);
    // Navigate back or reset
  }, []);

  const currentQuestion = questions[currentIndex];

  if (showCompletion) {
    return (
      <CompletionCelebration
        visible={true}
        deckTitle="Behavioral Basics"
        questionsAnswered={questions.length}
        correctCount={correctCount}
        streak={streak + 1}
        bestStreak={bestStreak}
        onContinue={handleContinue}
        onShare={() => analytics.capture('progress_shared', { deck_id: deckId })}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.text.primary }]}>Loading questions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => {/* Go back */}}
          accessibilityLabel="Go back"
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

      {/* Question Counter */}
      <View style={styles.counterRow}>
        <Text style={[styles.counter, { color: theme.text.muted }]}>
          Question {currentIndex + 1} of {questions.length}
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

      <SuccessBurst
        visible={showSuccess}
        onComplete={() => console.log('Burst complete')}
      />
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
    marginTop: 64,
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
