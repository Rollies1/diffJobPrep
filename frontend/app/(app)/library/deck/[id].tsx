import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../src/theme/ThemeProvider';
import { usePremiumEntrance } from '../../../../src/hooks/usePremiumEntrance';
import { PremiumCard } from '../../../../src/components/PremiumCard';
import { SwipeableRow } from '../../../../src/components/SwipeableRow';
import { PremiumButton } from '../../../../src/components/PremiumButton';

// ─── Mock Data ─────────────────────────────────────
const QUESTIONS: Record<string, Array<{
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bookmarked: boolean;
}>> = {
  '1': [
    { id: 'q1', title: 'Design a URL shortener like Bitly', difficulty: 'medium', bookmarked: false },
    { id: 'q2', title: 'How would you scale a chat application to 1M users?', difficulty: 'hard', bookmarked: true },
    { id: 'q3', title: 'Explain CAP theorem with examples', difficulty: 'easy', bookmarked: false },
    { id: 'q4', title: 'Design a distributed cache', difficulty: 'hard', bookmarked: false },
  ],
  '2': [
    { id: 'q5', title: 'Tell me about a time you failed', difficulty: 'medium', bookmarked: false },
    { id: 'q6', title: 'How do you handle conflict in a team?', difficulty: 'easy', bookmarked: true },
  ],
  '3': [
    { id: 'q7', title: 'Explain the React Native bridge', difficulty: 'medium', bookmarked: false },
    { id: 'q8', title: 'Hermes vs JSC: trade-offs', difficulty: 'hard', bookmarked: false },
  ],
};

const DECK_META: Record<string, { title: string; color: string }> = {
  '1': { title: 'System Design', color: '#00d4ff' },
  '2': { title: 'Behavioral', color: '#7c3aed' },
  '3': { title: 'React Native', color: '#f43f5e' },
};

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#f43f5e',
};

// ─── Components ────────────────────────────────────
function QuestionItem({
  item,
  index,
  onToggleBookmark,
}: {
  item: typeof QUESTIONS['1'][0];
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
                  style={{ backgroundColor: `${DIFFICULTY_COLORS[item.difficulty]}15` }}
                >
                  <Text
                    className="text-xs font-bold uppercase"
                    style={{
                      color: DIFFICULTY_COLORS[item.difficulty],
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
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const theme = useTheme();
  const router = useRouter();
  
  // Safe extraction for TS
  const safeDeckId = Array.isArray(deckId) ? deckId[0] : deckId;
  const meta = safeDeckId ? DECK_META[safeDeckId] : null;
  const questions = safeDeckId ? QUESTIONS[safeDeckId] : [];
  
  const finalMeta = meta ?? { title: 'Unknown Deck', color: theme.semantic.info };

  const headerStyle = usePremiumEntrance(0);
  const listStyle = usePremiumEntrance(1);

  const handleToggleBookmark = useCallback((questionId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Bookmark toggled:', questionId);
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
              {finalMeta.title}
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.text.secondary, fontFamily: 'Inter_400Regular' }}
            >
              {questions?.length ?? 0} questions
            </Text>
          </View>
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: finalMeta.color }}
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
        <FlatList
          data={questions}
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
              <Text
                className="text-base"
                style={{ color: theme.text.muted, fontFamily: 'Inter_400Regular' }}
              >
                No questions in this deck yet.
              </Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
}
