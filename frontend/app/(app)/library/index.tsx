import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { DeckCard } from '../../../src/components/library/DeckCard';
import { PaywallModal } from '../../../src/components/paywall/PaywallModal';
import { PreviewGate } from '../../../src/components/paywall/PreviewGate';
import { usePremiumStatus } from '../../../src/hooks/usePremiumStatus';
import { offlineDB } from '../../../src/offline/database';
import { syncManager } from '../../../src/offline/syncManager';
import { analytics } from '../../../src/analytics/posthog';

interface Deck {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
  isPremium: boolean;
  questionCount: number;
  isAvailableOffline: boolean;
}

export default function LibraryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const { isPremium, canAccessDeck, subscribe } = usePremiumStatus();

  useEffect(() => {
    loadDecks();
    analytics.screen('library');
  }, []);

  const loadDecks = async () => {
    const offlineDecks = await offlineDB.getAllDecks(); // Show all decks, not just offline
    const mapped = await Promise.all(offlineDecks.map(async (d) => {
      const progress = await offlineDB.getProgressForDeck(d.id);
      return {
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        progress: progress.total > 0 ? Math.round((progress.mastered / progress.total) * 100) : 0,
        isPremium: d.is_premium === 1,
        questionCount: d.question_count,
        isAvailableOffline: d.is_available_offline === 1, // Fix: Use real DB field
      };
    }));
    
    setDecks(mapped);
    await syncManager.syncIfOnline();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncManager.syncIfOnline();
    await loadDecks();
    setRefreshing(false);
  };

  const handleDownload = async (deckId: string) => {
    try {
      await syncManager.downloadDeckForOffline(deckId);
      await loadDecks();
    } catch {
      // Error handled in syncManager analytics
    }
  };

  const handleDeckPress = useCallback((deck: Deck) => {
    if (!canAccessDeck(deck.id, deck.isPremium)) {
      // First tap on locked premium = preview, second = paywall
      setPreviewDeck(deck);
      return;
    }
    
    analytics.sessionStarted(deck.id, deck.isPremium);
    router.push(`/(app)/practice?deckId=${deck.id}`);
  }, [canAccessDeck, router]);

  const handlePreviewComplete = useCallback(() => {
    setPreviewDeck(null);
  }, []);

  const handlePreviewUpgrade = useCallback(() => {
    if (previewDeck) {
      setSelectedDeck(previewDeck.title);
      setPreviewDeck(null);
      setPaywallVisible(true);
    }
  }, [previewDeck]);

  const handleUnlock = useCallback((deck: Deck) => {
    setSelectedDeck(deck.title);
    setPaywallVisible(true);
    analytics.paywallViewed(deck.id);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Deck; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
      <DeckCard
        id={item.id}
        title={item.title}
        subtitle={item.subtitle}
        progress={item.progress}
        isPremium={item.isPremium}
        isLocked={item.isPremium && !isPremium && !canAccessDeck(item.id, true)}
        questionCount={item.questionCount}
        isAvailableOffline={item.isAvailableOffline}
        onPress={() => handleDeckPress(item)}
        onPreview={() => setPreviewDeck(item)}
        onUnlock={() => handleUnlock(item)}
        onDownload={() => handleDownload(item.id)}
      />
    </Animated.View>
  ), [isPremium, canAccessDeck, handleDeckPress, handleUnlock]);

  // If in preview mode, show preview gate
  if (previewDeck) {
    return (
      <PreviewGate
        deckId={previewDeck.id}
        deckTitle={previewDeck.title}
        onComplete={handlePreviewComplete}
        onUpgrade={handlePreviewUpgrade}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Question Library', headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]} accessibilityRole="header">
            Interview Library
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>Master your next offer</Text>
        </View>
        {isPremium && (
          <View style={[styles.proBadge, { borderColor: 'rgba(255,215,0,0.2)', backgroundColor: 'rgba(255,215,0,0.1)' }]}>
            <Ionicons name="diamond" size={14} color={theme.premium.gold} />
            <Text style={[styles.proBadgeText, { color: theme.premium.gold }]}>PRO</Text>
          </View>
        )}
      </View>

      <FlatList
        data={decks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.text.secondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>No decks available</Text>
            <Pressable onPress={handleRefresh} style={[styles.emptyButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.emptyButtonText, { color: theme.text.primary }]}>Sync Now</Text>
            </Pressable>
          </View>
        }
      />

      <PaywallModal
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
        onSubscribe={async (tier) => {
          const success = await subscribe(tier);
          if (success) setPaywallVisible(false);
        }}
        triggerDeck={selectedDeck}
      />
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    marginLeft: 4,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 64,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyButtonText: {
    fontFamily: 'Inter_600SemiBold',
  },
});
