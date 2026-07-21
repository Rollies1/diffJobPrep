import { offlineDB } from './database';
import { analytics } from '../analytics/posthog';

interface SyncCheckpoint {
  deckId: string;
  lastSyncedAt: string;
  lastQuestionId: string;
  version: number;
}

class DeltaSyncManager {
  async getCheckpoints(): Promise<Record<string, SyncCheckpoint>> {
    try {
      const raw = await offlineDB.db?.getFirstAsync<{ checkpoints: string }>(
        `SELECT checkpoints FROM sync_meta WHERE id = 1`
      );
      return raw && raw.checkpoints ? JSON.parse(raw.checkpoints) : {};
    } catch {
      return {};
    }
  }

  async saveCheckpoint(checkpoint: SyncCheckpoint) {
    const checkpoints = await this.getCheckpoints();
    checkpoints[checkpoint.deckId] = checkpoint;
    
    await offlineDB.db?.runAsync(
      `INSERT INTO sync_meta (id, checkpoints) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET checkpoints = excluded.checkpoints`,
      [JSON.stringify(checkpoints)]
    );
  }

  async syncDeckDelta(deckId: string): Promise<boolean> {
    const checkpoints = await this.getCheckpoints();
    const checkpoint = checkpoints[deckId];
    
    const url = new URL(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8089/api'}/decks/${deckId}/delta`);
    if (checkpoint) {
      url.searchParams.set('since', checkpoint.lastSyncedAt);
      url.searchParams.set('after_id', checkpoint.lastQuestionId);
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Delta sync failed');

      const delta: {
        added: Array<{ id: string; question_text: string; answer_guidance: string; difficulty: string }>;
        modified: Array<{ id: string; question_text: string; answer_guidance: string; difficulty: string }>;
        deleted: string[];
        newCheckpoint: SyncCheckpoint;
      } = await response.json();

      await offlineDB.db?.withTransactionAsync(async () => {
        // Insert new
        for (const q of delta.added) {
          await offlineDB.db!.runAsync(
            `INSERT INTO questions (id, deck_id, question_text, answer_guidance, difficulty)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO NOTHING`,
            [q.id, deckId, q.question_text, q.answer_guidance, q.difficulty]
          );
        }

        // Update modified
        for (const q of delta.modified) {
          await offlineDB.db!.runAsync(
            `UPDATE questions SET question_text = ?, answer_guidance = ?, difficulty = ?
             WHERE id = ?`,
            [q.question_text, q.answer_guidance, q.difficulty, q.id]
          );
        }

        // Soft-delete
        for (const id of delta.deleted) {
          await offlineDB.db!.runAsync(
            `DELETE FROM questions WHERE id = ?`,
            [id]
          );
        }

        // Update deck metadata
        await offlineDB.db!.runAsync(
          `UPDATE decks SET last_synced_at = ?, question_count = (
            SELECT COUNT(*) FROM questions WHERE deck_id = ?
          ) WHERE id = ?`,
          [delta.newCheckpoint.lastSyncedAt, deckId, deckId]
        );
      });

      await this.saveCheckpoint(delta.newCheckpoint);
      analytics.capture('delta_sync_completed', {
        deck_id: deckId,
        added: delta.added.length,
        modified: delta.modified.length,
        deleted: delta.deleted.length,
      });

      return true;
    } catch (error) {
      analytics.capture('delta_sync_failed', { deck_id: deckId, error: String(error) });
      return false;
    }
  }
}

export const deltaSync = new DeltaSyncManager();
