import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { gradients, shadows } from '../../../src/theme';
import { offlineDB, type DeckRow, type DeckDifficultyCounts } from '../../../src/offline/database';
import { syncManager } from '../../../src/offline/syncManager';
import { analytics } from '../../../src/analytics/posthog';

// Category → emoji map (mirrors src/screens/LibraryIndexScreen.tsx CATEGORY_EMOJIS).
const CATEGORY_EMOJIS: Record<string, string> = {
  Frontend: '⚛️',
  Backend: '🧩',
  Database: '🗄️',
  Architecture: '🏗️',
  'CS Fundamentals': '🔢',
  DevOps: '🚀',
  Infrastructure: '🌐',
  Security: '🔐',
  Tools: '🔧',
  Mobile: '📱',
  'AI/ML': '🤖',
  Data: '🛢️',
  Mathematics: '➗',
  Physics: '🔭',
  Chemistry: '⚗️',
  Biology: '🧬',
  Astronomy: '🌠',
  'Earth Science': '🌍',
  Environment: '🌱',
  History: '📜',
  Humanities: '🎭',
  'Social Science': '👥',
  Business: '💼',
  Design: '🎨',
  Medicine: '⚕️',
  'Soft Skills': '🤝',
  // legacy aliases
  Algorithms: '🎯',
  Behavioral: '🧭',
  'System Design': '🏗️',
  Databases: '🗄️',
  'Cloud & Infrastructure': '☁️',
  'Testing & QA': '🧪',
  'Product & Architecture': '📐',
  Other: '📚',
};

function emojiFor(category: string | null | undefined): string {
  if (!category) return CATEGORY_EMOJIS.Other;
  return CATEGORY_EMOJIS[category] ?? CATEGORY_EMOJIS.Other;
}

/** Render a deck's difficulty summary as a compact "3E · 5M · 2H" string. */
function difficultySummary(counts: DeckDifficultyCounts | undefined, fallback: number): string {
  if (!counts || counts.easy + counts.medium + counts.hard === 0) {
    return `${fallback} Q`;
  }
  const parts: string[] = [];
  if (counts.easy > 0) parts.push(`${counts.easy}E`);
  if (counts.medium > 0) parts.push(`${counts.medium}M`);
  if (counts.hard > 0) parts.push(`${counts.hard}H`);
  return parts.length > 0 ? parts.join(' · ') : `${fallback} Q`;
}

interface LibraryDeck extends DeckRow {
  difficulty?: DeckDifficultyCounts;
}

interface LibrarySection {
  category: string;
  data: LibraryDeck[];
}

export default function LibraryScreen() {
  const router = useRouter();
  const c = useThemeColors();

  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    loadDecks();
    analytics.screen('library');
    // Background sync of deck metadata (cheap — one GET /questions/decks).
    syncManager.syncIfOnline().then(() => loadDecks()).catch(() => {});
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const loadDecks = useCallback(async () => {
    const [groups, difficultyMap] = await Promise.all([
      offlineDB.getDecksGroupedByCategory(),
      offlineDB.getDeckDifficultyCounts(),
    ]);
    const next: LibrarySection[] = groups.map((g) => ({
      category: g.category,
      data: g.decks.map((d) => ({ ...d, difficulty: difficultyMap[d.id] })),
    }));
    setSections(next);
  }, []);

  const runSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('Fetching deck catalog…');
    try {
      const result = await syncManager.syncFullLibrary((msg) => setSyncMessage(msg));
      await loadDecks();
      showToast(`Synced ${result.decks} decks · ${result.questions} questions`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
      setSyncMessage('');
    }
  }, [syncing, loadDecks, showToast]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await runSync();
    setRefreshing(false);
  }, [runSync]);

  const handleDeckPress = useCallback(
    (deck: LibraryDeck) => {
      analytics.sessionStarted(deck.id, false);
      router.push({
        pathname: '/(app)/library/deck/[id]',
        params: {
          id: deck.id,
          title: deck.title,
          category: deck.category ?? '',
          color: deck.color_hex ?? '',
        },
      });
    },
    [router],
  );

  const handleDownload = useCallback(
    async (deckId: string) => {
      try {
        await syncManager.downloadDeckForOffline(deckId);
        await loadDecks();
        showToast('Deck downloaded for offline');
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Download failed');
      }
    },
    [loadDecks, showToast],
  );

  const renderDeckCard = useCallback(
    ({ item, index }: { item: LibraryDeck; index: number }) => (
      <Animated.View entering={FadeInUp.delay(Math.min(index * 40, 400)).duration(350)}>
        <Pressable
          onPress={() => handleDeckPress(item)}
          style={({ pressed }) => [
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.94 : 1,
              ...shadows.card,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${item.category ?? 'Uncategorized'}, ${item.question_count} questions`}
        >
          {/* Category color swatch */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
              backgroundColor: (item.color_hex ?? c.blue) + '22',
            }}
          >
            <Text style={{ fontSize: 22 }}>{emojiFor(item.category)}</Text>
          </View>

          <View style={{ flex: 1, marginRight: 10 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Inter_700Bold',
                color: c.ink,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: c.textSubtle,
                }}
                numberOfLines={1}
              >
                {item.category ?? 'Uncategorized'}
              </Text>
              <Text style={{ fontSize: 12, color: c.textSubtle }}>·</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: c.textMuted,
                }}
              >
                {item.question_count} Q
              </Text>
            </View>
          </View>

          {/* Difficulty summary badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: c.infoBg,
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_700Bold',
                color: c.blue,
                letterSpacing: 0.2,
              }}
            >
              {difficultySummary(item.difficulty, item.question_count)}
            </Text>
          </View>

          {/* Offline indicator / download affordance */}
          {item.is_available_offline === 1 ? (
            <Ionicons name="cloud-download" size={16} color={c.success} />
          ) : (
            <Pressable
              onPress={() => handleDownload(item.id)}
              hitSlop={8}
              accessibilityLabel="Download for offline"
              accessibilityRole="button"
            >
              <Ionicons name="download-outline" size={18} color={c.textSubtle} />
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    ),
    [c, handleDeckPress, handleDownload],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: LibrarySection }) => (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 18,
          paddingBottom: 10,
          paddingHorizontal: 20,
          backgroundColor: c.bg,
        }}
      >
        <Text style={{ fontSize: 20, marginRight: 8 }}>{emojiFor(section.category)}</Text>
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Inter_700Bold',
            color: c.ink,
            flex: 1,
          }}
          accessibilityRole="header"
        >
          {section.category}
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: c.surfaceMuted,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              color: c.textMuted,
            }}
          >
            {section.data.length} {section.data.length === 1 ? 'deck' : 'decks'}
          </Text>
        </View>
      </View>
    ),
    [c],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={{ alignItems: 'center', paddingTop: 96, paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>📚</Text>
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Inter_700Bold',
            color: c.ink,
            marginBottom: 8,
          }}
        >
          No decks available
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Inter_400Regular',
            color: c.textMuted,
            textAlign: 'center',
            marginBottom: 28,
            lineHeight: 20,
          }}
        >
          Sync your interview library to fetch 70 decks and 700 questions grouped by category.
        </Text>
        <Pressable
          onPress={runSync}
          disabled={syncing}
          style={{ borderRadius: 18, overflow: 'hidden', opacity: syncing ? 0.7 : 1 }}
        >
          <LinearGradient
            colors={gradients.primary as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 32,
              paddingVertical: 16,
              gap: 10,
            }}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="sync" size={18} color="#fff" />
            )}
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Inter_700Bold',
                color: '#fff',
              }}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </Text>
          </LinearGradient>
        </Pressable>
        {syncing && syncMessage ? (
          <Text
            style={{
              marginTop: 14,
              fontSize: 12,
              fontFamily: 'Inter_400Regular',
              color: c.textMuted,
            }}
          >
            {syncMessage}
          </Text>
        ) : null}
      </View>
    ),
    [c, runSync, syncing, syncMessage],
  );

  // Total deck count (for the header subtitle).
  const totalDecks = sections.reduce((sum, s) => sum + s.data.length, 0);

  return (
    <>
      <Stack.Screen options={{ title: 'Interview Library', headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.headerTitle, { color: c.ink }]}
              accessibilityRole="header"
            >
              Interview Library
            </Text>
            <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>
              {totalDecks > 0
                ? `${totalDecks} decks · ${sections.length} categories`
                : 'Master your next offer'}
            </Text>
          </View>
          <Pressable
            onPress={runSync}
            disabled={syncing}
            hitSlop={8}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 14,
                backgroundColor: c.surface,
                borderColor: c.border,
                borderWidth: 1,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sync library now"
          >
            {syncing ? (
              <ActivityIndicator size="small" color={c.blue} />
            ) : (
              <Ionicons name="sync" size={15} color={c.blue} />
            )}
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Inter_600SemiBold',
                color: c.blue,
              }}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </Text>
          </Pressable>
        </View>

        {/* Sync progress bar */}
        {syncing && syncMessage ? (
          <View style={[styles.syncBar, { backgroundColor: c.infoBg }]}>
            <ActivityIndicator size="small" color={c.blue} />
            <Text style={[styles.syncBarText, { color: c.blue }]}>{syncMessage}</Text>
          </View>
        ) : null}

        {/* Grouped deck list */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderDeckCard}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.blue}
              colors={[c.blue]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />

        {/* Inline toast (no extra deps) */}
        {toast ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              bottom: Platform.OS === 'ios' ? 96 : 88,
              zIndex: 50,
            }}
          >
            <View
              style={{
                backgroundColor: c.ink,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                ...shadows.float,
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color={c.tealGreen} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter_600SemiBold',
                  color: c.bg,
                  flex: 1,
                }}
                numberOfLines={2}
              >
                {toast}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  syncBarText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
});
