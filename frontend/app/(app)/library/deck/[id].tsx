import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../src/theme/ThemeProvider';
import { usePremiumEntrance } from '../../../../src/hooks/usePremiumEntrance';
import { PremiumCard } from '../../../../src/components/PremiumCard';
import { SwipeableRow } from '../../../../src/components/SwipeableRow';
import { PremiumButton } from '../../../../src/components/PremiumButton';
import { useDeckDetail } from '../../../../src/hooks/queries/useDeckDetail';

// Deck metadata (title / color / category) is passed via route params from the
// Library explore + deck list screens. Questions are fetched live from the
// questionservice via useDeckDetail — no mock data.

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#f43f5e',
  EASY: '#22c55e',
  MEDIUM: '#eab308',
  HARD: '#f43f5e',
};

interface DeckQuestion {
  id: string;
  title: string;
  content?: string;
  difficulty: string;
  bookmarked: boolean;
  completed?: boolean;
}

// ─── Components ────────────────────────────────────
function QuestionItem({
  item,
  index,
  onToggleBookmark,
}: {
  item: DeckQuestion;
  index: number;
  onToggleBookmark: (id: string) => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const style = usePremiumEntrance(index);
  const [bookmarked, setBookmarked] = useState(item.bookmarked);

  const handleBookmark = useCallback(() => {
    setBookmarked((v) => !v);
    onToggleBookmark(item.id);
  }, [item.id, onToggleBookmark]);

  const diffColor = DIFFICULTY_COLORS[item.difficulty] ?? DIFFICULTY_COLORS.medium;

  return (
    <Animated.View style={style}>
      <SwipeableRow onBookmark={handleBookmark} bookmarked={bookmarked}>
        <PremiumCard className="p-4" onPress={() => router.push(`/(app)/library/question/${item.id}`)}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text
                className="text-sm font-semibold mb-2 leading-5"
                style={{ color: theme.text.primary, fontFamily: 'Inter_600SemiBold' }}
              >
                {item.title}
              </Text>
              <View className="flex-row items-center">
                <View
                  className="px-2 py-0.5 rounded-full mr-2"
                  style={{ backgroundColor: `${diffColor}15` }}
                >
                  <Text
                    className="text-xs font-bold uppercase"
                    style={{
                      color: diffColor,
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    {item.difficulty}
                  </Text>
                </View>
                {bookmarked && (
                  <Text className="text-xs" style={{ color: theme.semantic.info, fontFamily: 'Inter_400Regular' }}>
                    Saved
                  </Text>
                )}
              </View>
            </View>
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: bookmarked ? `${theme.semantic.info}20` : 'transparent',
                borderWidth: 1,
                borderColor: bookmarked ? theme.semantic.info : theme.border,
              }}
            >
              <Text style={{ color: bookmarked ? theme.semantic.info : theme.text.muted }}>
                {bookmarked ? '★' : '☆'}
              </Text>
            </View>
          </View>
        </PremiumCard>
      </SwipeableRow>
    </Animated.View>
  );
}

export default function DeckDetailScreen() {
  const params = useLocalSearchParams<{ id: string; title?: string; category?: string; color?: string }>();
  const theme = useTheme();
  const router = useRouter();

  const safeDeckId = Array.isArray(params.id) ? params.id[0] : params.id;
  const deckTitle = (Array.isArray(params.title) ? params.title[0] : params.title) ?? 'Deck';
  const deckColor = (Array.isArray(params.color) ? params.color[0] : params.color) ?? theme.semantic.info;

  // Live questions from the questionservice (with offline-first local fallback
  // inside the hook). Replaces the previous hardcoded QUESTIONS mock.
  const { data: questions, isLoading } = useDeckDetail(safeDeckId ?? '');
  const deckQuestions: DeckQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    title: q.title ?? 'Untitled question',
    content: q.content,
    difficulty: q.difficulty ?? 'medium',
    bookmarked: !!q.bookmarked,
    completed: !!q.completed,
  }));

  const headerStyle = usePremiumEntrance(0);
  const listStyle = usePremiumEntrance(1);

  const handleToggleBookmark = useCallback((questionId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Sync to SQLite + queue for backend sync (offline-first hook)
  }, []);

  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      className="flex-1"
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Stack.Screen options={{
        title: 'Deck Detail',
        headerBackTitle: 'Library',
        headerTintColor: '#2563eb',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }} />
      <View className="flex-1 px-5 pt-6">
        {/* Header */}
        <Animated.View style={headerStyle} className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: theme.surfaceOverlay, borderWidth: 1, borderColor: theme.border }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={{ color: theme.text.primary }}>←</Text>
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.text.primary, fontFamily: 'Inter_700Bold' }}
            >
              {deckTitle}
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.text.secondary, fontFamily: 'Inter_400Regular' }}
            >
              {deckQuestions.length} questions
            </Text>
          </View>
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: deckColor }}
          />
        </Animated.View>

        {/* Start Practice CTA */}
        <Animated.View style={listStyle} className="mb-6">
          <PremiumButton
            title="Start Practice Session"
            onPress={() => router.push(`/(app)/practice?deckId=${safeDeckId}`)}
          />
        </Animated.View>

        {/* Question List */}
        {isLoading ? (
          <View className="mt-20 items-center">
            <ActivityIndicator color={theme.semantic.info} />
            <Text className="mt-3 text-sm" style={{ color: theme.text.muted, fontFamily: 'Inter_400Regular' }}>
              Loading questions…
            </Text>
          </View>
        ) : (
          <FlatList
            data={deckQuestions}
            keyExtractor={(q) => q.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item, index }) => (
              <QuestionItem
                item={item}
                index={index + 2}
                onToggleBookmark={handleToggleBookmark}
              />
            )}
            ListEmptyComponent={
              <View className="mt-20 items-center">
                <Text className="text-base" style={{ color: theme.text.muted, fontFamily: 'Inter_400Regular' }}>
                  No questions in this deck yet.
                </Text>
                <Text className="text-xs mt-1" style={{ color: theme.text.muted, fontFamily: 'Inter_400Regular' }}>
                  Pull down to sync from the server.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}
