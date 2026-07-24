import NetInfo from '@react-native-community/netinfo';
import { offlineDB, type QuestionRow } from './database';
import { analytics } from '../analytics/posthog';
import { questionService } from '../services/questions';
import type { DeckDto, QuestionDto } from '../types/api';

/** Map a backend QuestionDto to the local SQLite QuestionRow shape. */
function mapQuestion(q: QuestionDto): QuestionRow {
  const difficulty = (q.difficulty || 'medium').toLowerCase();
  return {
    id: q.id,
    deck_id: q.deckId,
    question_text: q.content || q.title,
    answer_guidance: q.hint ?? null,
    difficulty: (difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium') as
      | 'easy'
      | 'medium'
      | 'hard',
    category: q.category ?? null,
  };
}

/** Fetch every question for a deck by paging until nextCursor is null. */
async function fetchAllQuestionsForDeck(deckId: string): Promise<QuestionDto[]> {
  const all: QuestionDto[] = [];
  let cursor: string | null | undefined = undefined;
  // Hard ceiling to avoid an infinite loop if the API misbehaves.
  for (let i = 0; i < 50; i++) {
    const page = await questionService.getQuestions(deckId, cursor, 100);
    all.push(...(page.data ?? []));
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}

class SyncManager {
  private isSyncing = false;
  private listenerAttached = false;

  async init() {
    // Ensure the local DB is open before anything else.
    await offlineDB.init();

    // Initial sync on app launch
    await this.syncIfOnline();

    // Listen for connectivity changes (only once).
    if (!this.listenerAttached) {
      this.listenerAttached = true;
      NetInfo.addEventListener((state) => {
        if (state.isConnected && state.isInternetReachable) {
          this.syncIfOnline();
        }
      });
    }
  }

  async syncIfOnline() {
    const state = await NetInfo.fetch();
    if (!state.isConnected || !state.isInternetReachable) return;

    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Flush analytics queue
      await analytics.flushQueue();

      // 2. Flush offline sync queue
      const queue = await offlineDB.flushSyncQueue();
      for (const item of queue) {
        try {
          const response = await fetch(item.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: item.payload,
          });

          if (response.ok) {
            await offlineDB.removeSyncQueueItem(item.id);
          }
        } catch {
          // Keep in queue for next retry
        }
      }

      // 3. Sync deck metadata from server (real fetch).
      await this.syncDeckCatalog();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Fetch the deck catalog from the questionservice and persist metadata
   * (title, category, color, question count) to SQLite. Returns the number
   * of decks synced. Does NOT fetch questions — call syncFullLibrary() or
   * downloadDeckForOffline() for that.
   */
  private async syncDeckCatalog(): Promise<number> {
    try {
      const decks = await questionService.getDecks();
      await offlineDB.syncDecks(
        decks.map((d: DeckDto) => ({
          id: d.id,
          title: d.title,
          isPremium: false,
          questionCount: d.questionCount ?? 0,
          category: d.category ?? null,
          colorHex: d.color ?? null,
        })),
      );
      return decks.length;
    } catch {
      // Silent fail — catalog will sync next time.
      return 0;
    }
  }

  /**
   * Full sync: fetch every deck's metadata + every deck's questions and
   * persist them locally so the Library + Practice screens can render
   * offline. Decks are fetched in small batches (6 at a time) to avoid
   * hammering the gateway.
   *
   * Returns `{ decks, questions }` counts for UI feedback.
   */
  async syncFullLibrary(onProgress?: (msg: string) => void): Promise<{ decks: number; questions: number }> {
    // Make sure we have a connection before doing real work.
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      throw new Error('No internet connection');
    }

    // Ensure DB is open.
    await offlineDB.init();

    onProgress?.('Fetching deck catalog…');

    // 1. Fetch + persist deck metadata.
    const decks = await questionService.getDecks();
    await offlineDB.syncDecks(
      decks.map((d: DeckDto) => ({
        id: d.id,
        title: d.title,
        isPremium: false,
        questionCount: d.questionCount ?? 0,
        category: d.category ?? null,
        colorHex: d.color ?? null,
      })),
    );

    onProgress?.(`Syncing ${decks.length} decks…`);

    // 2. Fetch questions for each deck, in batches of 6.
    const BATCH = 6;
    let totalQuestions = 0;

    for (let i = 0; i < decks.length; i += BATCH) {
      const slice = decks.slice(i, i + BATCH);
      const settled = await Promise.all(
        slice.map(async (deck) => {
          try {
            const questions = await fetchAllQuestionsForDeck(deck.id);
            if (questions.length > 0) {
              await offlineDB.downloadDeck(deck.id, questions.map(mapQuestion));
            }
            return questions.length;
          } catch {
            // A single deck failing shouldn't abort the whole sync.
            return 0;
          }
        }),
      );
      totalQuestions += settled.reduce((a, b) => a + b, 0);

      const done = Math.min(i + BATCH, decks.length);
      onProgress?.(`Syncing ${decks.length} decks… (${done}/${decks.length})`);
    }

    analytics.capture('library_full_sync', {
      decks: decks.length,
      questions: totalQuestions,
    });

    return { decks: decks.length, questions: totalQuestions };
  }

  /**
   * Fetch a single deck's questions and persist them locally so the deck
   * can be practiced offline. Used by per-deck "Download" buttons.
   */
  async downloadDeckForOffline(deckId: string) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      throw new Error('No internet connection');
    }

    await offlineDB.init();

    try {
      const questions = await fetchAllQuestionsForDeck(deckId);
      await offlineDB.downloadDeck(
        deckId,
        questions.map(mapQuestion),
      );

      analytics.capture('deck_downloaded', { deck_id: deckId, question_count: questions.length });
    } catch (error) {
      analytics.capture('deck_download_failed', { deck_id: deckId, error: String(error) });
      throw error;
    }
  }
}

export const syncManager = new SyncManager();
