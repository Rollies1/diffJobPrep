import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withSequence, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import { useSession, useSubmitAnswer, useCompleteSession } from '../../../../src/hooks/usePractice';
import { useQuestion } from '../../../../src/hooks/useQuestions';
import { usePracticeStore } from '../../../../src/stores/practiceStore';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../src/theme/ThemeProvider';
import { PremiumButton } from '../../../../src/components/PremiumButton';
import { PremiumCard } from '../../../../src/components/PremiumCard';
import { springs } from '../../../../src/animations/presets';

const { width } = Dimensions.get('window');

export default function PracticeSessionScreen() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const safeSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
  const { data: session, isLoading: sessionLoading } = useSession(safeSessionId!);
  const theme = useTheme();

  const {
    currentIndex,
    startTime,
    initSession,
  } = usePracticeStore();

  const completeSession = useCompleteSession();

  useEffect(() => {
    if (session && !usePracticeStore.getState().sessionId) {
      initSession(session.id);
    }
  }, [session, initSession]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (sessionLoading || !session) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.semantic.info} />
      </View>
    );
  }

  const currentRef = session.questions[currentIndex];

  if (!currentRef) {
    return (
      <LinearGradient colors={[theme.background, theme.surface]} className="flex-1 justify-center items-center px-6">
        <View 
          className="w-24 h-24 rounded-full items-center justify-center mb-8 shadow-lg"
          style={{ backgroundColor: `${theme.semantic.info}20`, borderColor: theme.semantic.info, borderWidth: 1 }}
        >
          <Text className="text-5xl">🎉</Text>
        </View>
        <Text className="text-3xl font-extrabold mb-3 tracking-tight" style={{ color: theme.text.primary, fontFamily: 'Inter_700Bold' }}>
          All Done!
        </Text>
        <Text className="mb-10 text-center text-lg leading-relaxed" style={{ color: theme.text.secondary, fontFamily: 'Inter_400Regular' }}>
          You've completed all questions. Submit your session to get your final score and AI feedback.
        </Text>
        <PremiumButton
          title="View Results"
          onPress={async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const result = await completeSession.mutateAsync(safeSessionId!);
            router.replace({
              pathname: '/(app)/dashboard',
              params: { result: JSON.stringify(result) },
            });
          }}
          loading={completeSession.isPending}
          style={{ width: '100%' }}
        />
      </LinearGradient>
    );
  }

  return (
    <SessionQuestion
      sessionId={safeSessionId!}
      questionRef={currentRef}
      currentIndex={currentIndex}
      totalQuestions={session.questions.length}
      elapsed={elapsed}
      formatTime={formatTime}
    />
  );
}

function SessionQuestion({
  sessionId,
  questionRef,
  currentIndex,
  totalQuestions,
  elapsed,
  formatTime,
}: {
  sessionId: string;
  questionRef: any;
  currentIndex: number;
  totalQuestions: number;
  elapsed: number;
  formatTime: (s: number) => string;
}) {
  const { data: question, isLoading } = useQuestion(questionRef.questionId);
  const theme = useTheme();
  
  const {
    answers,
    flaggedQuestions,
    setAnswer,
    submitAnswer: storeSubmit,
    toggleFlag,
    nextQuestion,
    prevQuestion,
    setSubmitting,
  } = usePracticeStore();

  const submitAnswerMutation = useSubmitAnswer();
  const [localAnswer, setLocalAnswer] = useState('');

  const existing = answers[questionRef.questionId];
  const isFlagged = flaggedQuestions.has(questionRef.questionId);
  const isLast = currentIndex === totalQuestions - 1;

  // Animated Progress Width
  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withSpring(((currentIndex + 1) / totalQuestions) * 100, springs.gentle);
  }, [currentIndex, totalQuestions, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  useEffect(() => {
    setLocalAnswer(existing?.answer || '');
  }, [questionRef.questionId, existing]);

  if (isLoading || !question) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.semantic.info} />
      </View>
    );
  }

  const handleOptionSelect = (option: string) => {
    Haptics.selectionAsync();
    setLocalAnswer(option);
    setAnswer(questionRef.questionId, option);
  };

  const handleToggleFlag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFlag(questionRef.questionId);
  };

  const handleSubmit = async () => {
    if (!localAnswer.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    try {
      await submitAnswerMutation.mutateAsync({
        sessionId,
        questionId: questionRef.questionId,
        answer: localAnswer,
        timeSpent: elapsed,
      });

      storeSubmit(questionRef.questionId, localAnswer, elapsed);
      setSubmitting(false);

      if (!isLast) {
        nextQuestion();
      } else {
        nextQuestion(); // Triggers completion screen
      }
    } catch {
      setSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      {/* Dynamic Gradient based on progress */}
      <LinearGradient 
        colors={[
          currentIndex > totalQuestions / 2 ? theme.semantic.info : theme.background, 
          theme.surface
        ]} 
        className="flex-1"
      >
        
        {/* Floating Glass Header */}
        <BlurView
          intensity={theme.isDark ? 30 : 60}
          tint={theme.isDark ? 'dark' : 'light'}
          className="pt-12 pb-4 z-10 shadow-sm border-b"
          style={{ borderColor: theme.border }}
        >
          <View className="px-6 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View 
                className="px-3 py-1.5 rounded-full mr-3"
                style={{ backgroundColor: `${theme.semantic.info}15`, borderWidth: 1, borderColor: `${theme.semantic.info}30` }}
              >
                <Text style={{ color: theme.semantic.info, fontFamily: 'Inter_700Bold' }}>
                  {currentIndex + 1} / {totalQuestions}
                </Text>
              </View>
              <Text className="text-sm tracking-wider" style={{ color: theme.text.primary, fontFamily: 'Inter_600SemiBold' }}>
                {formatTime(elapsed)}
              </Text>
            </View>
            <Pressable onPress={handleToggleFlag} className="p-2 -mr-2" hitSlop={10}>
              <Text className="text-2xl" style={{ color: isFlagged ? theme.premium.purple : theme.text.muted }}>
                {isFlagged ? '⚑' : '⚐'}
              </Text>
            </Pressable>
          </View>
          
          {/* Animated Progress Bar */}
          <View className="h-1 w-full mt-4" style={{ backgroundColor: 'transparent' }}>
            <Animated.View
              className="h-full rounded-r-full"
              style={[{ backgroundColor: theme.semantic.info }, progressStyle]}
            />
          </View>
        </BlurView>

        <ScrollView className="flex-1 px-6 py-6" automaticallyAdjustKeyboardInsets={true} showsVerticalScrollIndicator={false}>
          <View className="mb-10 mt-2">
            <Text className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: theme.semantic.info, fontFamily: 'Inter_700Bold' }}>
              Question {currentIndex + 1}
            </Text>
            <Text className="text-2xl font-bold mb-4 leading-snug tracking-tight" style={{ color: theme.text.primary, fontFamily: 'Inter_700Bold' }}>
              {question.title}
            </Text>
            <Text className="text-lg leading-relaxed" style={{ color: theme.text.secondary, fontFamily: 'Inter_400Regular' }}>
              {question.content}
            </Text>
          </View>

          {question.type === 'mcq' && question.options ? (
            <View className="gap-4 pb-10">
              {question.options.map((option, idx) => (
                <OptionCard
                  key={idx}
                  option={option}
                  isSelected={localAnswer === option}
                  onSelect={() => handleOptionSelect(option)}
                  colors={colors}
                />
              ))}
            </View>
          ) : (
            <View className="pb-10">
              <View
                className="rounded-3xl border p-1"
                style={{ backgroundColor: theme.surfaceOverlay, borderColor: theme.border }}
              >
                <TextInput
                  value={localAnswer}
                  onChangeText={(text) => {
                    setLocalAnswer(text);
                    setAnswer(questionRef.questionId, text);
                  }}
                  multiline
                  textAlignVertical="top"
                  placeholder="Type your explanation here..."
                  placeholderTextColor={theme.text.muted}
                  style={{ 
                    color: theme.text.primary, 
                    fontFamily: 'Inter_400Regular',
                    minHeight: 220,
                    padding: 16,
                  }}
                  className="text-lg"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Footer */}
        <BlurView
          intensity={theme.isDark ? 30 : 60}
          tint={theme.isDark ? 'dark' : 'light'}
          className="p-4 border-t pb-8 flex-row justify-between items-center"
          style={{ borderColor: theme.border }}
        >
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              prevQuestion();
            }}
            disabled={currentIndex === 0}
            className="px-6 py-4 rounded-xl"
            style={{ opacity: currentIndex === 0 ? 0 : 1 }}
          >
            <Text style={{ color: theme.text.secondary, fontFamily: 'Inter_700Bold' }} className="text-base">Previous</Text>
          </Pressable>

          <PremiumButton
            title={submitAnswerMutation.isPending ? 'Saving...' : isLast ? 'Finish Session' : 'Save & Next'}
            onPress={handleSubmit}
            loading={submitAnswerMutation.isPending}
            disabled={!localAnswer.trim()}
            style={{ paddingHorizontal: 32 }}
          />
        </BlurView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function OptionCard({ option, isSelected, onSelect, colors }: { option: string; isSelected: boolean; onSelect: () => void; colors: any }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSequence(
        withSpring(0.95, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
    }
  }, [isSelected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <PremiumCard
        onPress={onSelect}
        className="p-5"
        style={{
          backgroundColor: isSelected ? `${theme.semantic.info}15` : theme.surfaceOverlay,
          borderColor: isSelected ? theme.semantic.info : theme.border,
        }}
      >
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-full border-2 mr-4 items-center justify-center" style={{
            borderColor: isSelected ? theme.semantic.info : theme.text.muted,
          }}>
            {isSelected && <View className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.semantic.info }} />}
          </View>
          <Text className="flex-1 text-base font-medium" style={{ color: isSelected ? theme.text.primary : theme.text.secondary, fontFamily: 'Inter_600SemiBold' }}>
            {option}
          </Text>
        </View>
      </PremiumCard>
    </Animated.View>
  );
}
