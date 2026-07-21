import { useState } from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, Modal } from 'react-native';
import { useQuestion, useToggleBookmark, useCheckAnswer, useRateDifficulty } from '../../../../src/hooks/useQuestions';
import { QuestionRenderer } from '../../../../src/components/QuestionRenderer/QuestionRenderer';
import { QuestionTimeline } from '../../../../src/components/QuestionTimeline';
import { QuestionNotes } from '../../../../src/components/QuestionNotes';
import { DeckSelector } from '../../../../src/components/DeckSelector';
import { useCreateSession } from '../../../../src/hooks/usePractice';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: question, isLoading, isError } = useQuestion(id);
  const toggleBookmark = useToggleBookmark();
  const checkAnswer = useCheckAnswer();
  const rateDifficulty = useRateDifficulty();
  const createSession = useCreateSession();

  const [previewAnswer, setPreviewAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; feedback?: string; explanation?: string } | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isError || !question) {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-slate-50">
        <Feather name="alert-triangle" size={48} color="#dc2626" className="mb-4" />
        <Text className="text-slate-900 font-bold text-xl mb-2">Question not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-slate-200 px-6 py-3 rounded-full">
          <Text className="text-slate-700 font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleCheckAnswer = async () => {
    if (!previewAnswer.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await checkAnswer.mutateAsync({ questionId: question.id, answer: previewAnswer });
    setFeedback(result);
    setShowFeedback(true);
    Haptics.notificationAsync(result.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  };

  const handleStartPractice = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const session = await createSession.mutateAsync('quick_practice');
      router.push(`/(app)/practice/session/${session.id}`);
    } catch {
      Alert.alert('Error', 'Could not start practice session');
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <Stack.Screen options={{
        title: 'Question Detail',
        headerBackTitle: 'Library',
        headerTintColor: '#2563eb',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }} />
      <View className="p-5 pb-12">
        {/* Header Tags & Actions */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-row gap-2 flex-wrap flex-1">
            <View className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                {question.type.replace('_', ' ')}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-lg border ${
                question.difficulty === 'easy' ? 'border-emerald-200 bg-emerald-50' : 
                question.difficulty === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'
              }`}>
              <Text className={`text-[10px] font-bold uppercase tracking-widest ${
                question.difficulty === 'easy' ? 'text-emerald-700' : 
                question.difficulty === 'medium' ? 'text-amber-700' : 'text-rose-700'
              }`}>{question.difficulty}</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <Pressable 
              onPress={() => {
                Haptics.selectionAsync();
                setShowDeckModal(true);
              }} 
              className="p-2.5 bg-white rounded-full border border-slate-200 shadow-sm"
            >
              <Feather name="layers" size={18} color="#64748b" />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleBookmark.mutate({ id: question.id, bookmark: !question.isBookmarked });
              }}
              className="p-2.5 bg-white rounded-full border border-slate-200 shadow-sm"
            >
              <Feather 
                name="bookmark" 
                size={18} 
                color={question.isBookmarked ? '#eab308' : '#cbd5e1'} 
              />
            </Pressable>
          </View>
        </View>

        <Text className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
          {question.title}
        </Text>
        <Text className="text-base text-slate-600 leading-relaxed mb-8">
          {question.content}
        </Text>

        {/* Advanced Community Stats */}
        {question.communityStats && (
          <View className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-8">
            <Text className="text-xs font-extrabold text-slate-400 uppercase mb-4 tracking-widest">Global Telemetry</Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-black text-slate-900 mb-1">{question.communityStats.totalAttempts}</Text>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attempts</Text>
              </View>
              <View className="w-px bg-slate-100" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-black text-emerald-600 mb-1">{Math.round(question.communityStats.globalAccuracy)}%</Text>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</Text>
              </View>
              <View className="w-px bg-slate-100" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-black text-slate-900 mb-1">{question.communityStats.averageTimeSeconds}s</Text>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Time</Text>
              </View>
            </View>
          </View>
        )}

        {/* Interactive Try It */}
        <View className="mb-8">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Interactive Preview</Text>
            <Pressable onPress={() => {
              Haptics.selectionAsync();
              setShowDifficultyModal(true);
            }}>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {question.personalStats?.personalDifficulty
                  ? `You Rated: ${question.personalStats.personalDifficulty.replace('_', ' ')}`
                  : 'Rate Difficulty'}
              </Text>
            </Pressable>
          </View>

          <QuestionRenderer
            question={question}
            selectedAnswer={previewAnswer}
            onSelectAnswer={setPreviewAnswer}
            showFeedback={showFeedback}
            feedback={feedback || undefined}
          />

          {!showFeedback ? (
            <Pressable
              onPress={handleCheckAnswer}
              disabled={!previewAnswer.trim() || checkAnswer.isPending}
              className={`mt-4 py-4 rounded-2xl items-center shadow-sm ${
                !previewAnswer.trim() || checkAnswer.isPending ? 'bg-slate-300' : 'bg-blue-600'
              }`}
            >
              {checkAnswer.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-extrabold text-base uppercase tracking-wider">Check My Answer</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowFeedback(false);
                setFeedback(null);
                setPreviewAnswer('');
              }}
              className="mt-4 py-4 rounded-2xl items-center bg-white border border-slate-200 shadow-sm"
            >
              <Text className="text-slate-700 font-extrabold text-base uppercase tracking-wider">Try Again</Text>
            </Pressable>
          )}
        </View>

        {/* Graph Modules */}
        <QuestionTimeline questionId={question.id} />
        <QuestionNotes questionId={question.id} />

        {/* Prerequisites */}
        {question.prerequisites && question.prerequisites.length > 0 && (
          <View className="mt-8">
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Knowledge Graph</Text>
            <View className="flex-row flex-wrap gap-2">
              {question.prerequisites.map((prereqId) => (
                <Pressable
                  key={prereqId}
                  onPress={() => router.push(`/(app)/library/question/${prereqId}`)}
                  className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 flex-row items-center"
                >
                  <Feather name="link" size={12} color="#7e22ce" className="mr-2" />
                  <Text className="text-purple-700 text-xs font-bold">Prerequisite {prereqId.slice(0, 4)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="gap-3 mt-10">
          <Pressable
            onPress={handleStartPractice}
            disabled={createSession.isPending}
            className="bg-blue-600 py-4 rounded-full items-center shadow-md flex-row justify-center"
          >
            {createSession.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Feather name="play" size={18} color="white" className="mr-2" />
                <Text className="text-white font-extrabold text-base tracking-wide ml-2">Practice This Setup</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: '/(app)/tutor', params: { questionId: question.id, topic: question.topic } })}
            className="bg-white py-4 rounded-full items-center border border-slate-200 shadow-sm flex-row justify-center"
          >
            <Feather name="cpu" size={18} color="#0f172a" className="mr-2" />
            <Text className="text-slate-900 font-bold text-base ml-2">Send to AI Tutor</Text>
          </Pressable>
        </View>
      </View>

      <DeckSelector visible={showDeckModal} onClose={() => setShowDeckModal(false)} questionId={question.id} />

      {/* ActionSheet for Rating */}
      <Modal visible={showDifficultyModal} transparent animationType="fade">
        <View className="flex-1 justify-end bg-slate-900/40">
          <Pressable className="flex-1" onPress={() => setShowDifficultyModal(false)} />
          <View className="bg-white rounded-t-3xl p-6 pb-12 shadow-xl">
            <Text className="text-xl font-extrabold text-slate-900 mb-6 text-center">Rate Personal Difficulty</Text>
            {(['too_easy', 'just_right', 'too_hard'] as const).map((rating) => (
              <Pressable
                key={rating}
                onPress={() => {
                  Haptics.selectionAsync();
                  rateDifficulty.mutate({ questionId: question.id, rating });
                  setShowDifficultyModal(false);
                }}
                className="py-4 border-b border-slate-100 last:border-0 flex-row items-center justify-between"
              >
                <Text className="text-base font-bold text-slate-800 capitalize">{rating.replace('_', ' ')}</Text>
                <Feather name="chevron-right" size={16} color="#cbd5e1" />
              </Pressable>
            ))}
            <Pressable onPress={() => setShowDifficultyModal(false)} className="mt-4 py-4 bg-slate-100 rounded-2xl items-center">
              <Text className="text-slate-600 font-bold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
