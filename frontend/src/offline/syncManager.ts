import NetInfo from '@react-native-community/netinfo';
import { offlineDB } from './database';
import { analytics } from '../analytics/posthog';

class SyncManager {
  private isSyncing = false;

  async init() {
    // Initial sync on app launch
    await this.syncIfOnline();
    
    // Listen for connectivity changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        this.syncIfOnline();
      }
    });
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
      
      // 3. Sync deck metadata from server
      await this.syncDeckCatalog();
      
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncDeckCatalog() {
    try {
      // In a real app, this fetches from the Gateway API
      // Since this is a mock implementation, we'll just insert some dummy decks 
      // if the DB is empty
      const existing = await offlineDB.getAllDecks();
      if (existing.length === 0) {
        await offlineDB.syncDecks([
          { id: '1', title: 'System Design Mastery', subtitle: 'Design a global URL Shortener', isPremium: true, questionCount: 150 },
          { id: '2', title: 'Behavioral Basics', subtitle: 'Tell me about a time...', isPremium: false, questionCount: 50 },
          { id: '3', title: 'Algorithms Advanced', subtitle: 'Dynamic programming challenges', isPremium: true, questionCount: 200 }
        ]);
      }
    } catch {
      // Silent fail — catalog will sync next time
    }
  }

  async downloadDeckForOffline(deckId: string) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      throw new Error('No internet connection');
    }
    
    try {
      // MOCK: Generate 50 fake questions for the requested deck
      const questions = Array.from({ length: 50 }).map((_, i) => ({
        id: `${deckId}_q_${i}`,
        deck_id: deckId,
        question_text: `Mock Question ${i + 1} for deck ${deckId}`,
        answer_guidance: 'Consider edge cases and scalability.',
        difficulty: (['easy', 'medium', 'hard'] as const)[Math.floor(Math.random() * 3)],
        category: 'Mock Category'
      }));
      
      await offlineDB.downloadDeck(deckId, questions);
      
      analytics.capture('deck_downloaded', { deck_id: deckId });
    } catch (error) {
      analytics.capture('deck_download_failed', { deck_id: deckId, error: String(error) });
      throw error;
    }
  }
}

export const syncManager = new SyncManager();
