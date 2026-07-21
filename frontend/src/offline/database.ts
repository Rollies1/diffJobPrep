import * as SQLite from 'expo-sqlite';

const DB_NAME = 'jobprep_offline.db';

export interface DeckRow {
  id: string;
  title: string;
  subtitle: string;
  is_premium: number;
  question_count: number;
  content_json: string | null;
  downloaded_at: string | null;
  last_synced_at: string | null;
  is_available_offline: number;
}

export interface QuestionRow {
  id: string;
  deck_id: string;
  question_text: string;
  answer_guidance: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string | null;
}

class OfflineDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT,
        is_premium INTEGER DEFAULT 0,
        question_count INTEGER DEFAULT 0,
        content_json TEXT,
        downloaded_at TEXT,
        last_synced_at TEXT,
        is_available_offline INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        question_text TEXT NOT NULL,
        answer_guidance TEXT,
        difficulty TEXT,
        category TEXT,
        FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS user_progress (
        question_id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        status TEXT CHECK(status IN ('unseen', 'attempted', 'mastered')) DEFAULT 'unseen',
        last_attempted_at TEXT,
        attempt_count INTEGER DEFAULT 0,
        FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_questions_deck ON questions(deck_id);
      CREATE INDEX IF NOT EXISTS idx_progress_deck ON user_progress(deck_id);
    `);
  }

  async syncDecks(decks: Array<{
    id: string;
    title: string;
    subtitle?: string;
    isPremium: boolean;
    questionCount: number;
  }>) {
    if (!this.db) return;
    
    const now = new Date().toISOString();
    
    for (const deck of decks) {
      await this.db.runAsync(
        `INSERT INTO decks (id, title, subtitle, is_premium, question_count, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           subtitle = excluded.subtitle,
           is_premium = excluded.is_premium,
           question_count = excluded.question_count,
           last_synced_at = excluded.last_synced_at`,
        [deck.id, deck.title, deck.subtitle || '', deck.isPremium ? 1 : 0, deck.questionCount, now]
      );
    }
  }

  async downloadDeck(deckId: string, questions: QuestionRow[]) {
    if (!this.db) return;
    
    const now = new Date().toISOString();
    
    await this.db.withTransactionAsync(async () => {
      for (const q of questions) {
        await this.db!.runAsync(
          `INSERT INTO questions (id, deck_id, question_text, answer_guidance, difficulty, category)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             question_text = excluded.question_text,
             answer_guidance = excluded.answer_guidance,
             difficulty = excluded.difficulty,
             category = excluded.category`,
          [q.id, q.deck_id, q.question_text, q.answer_guidance || null, q.difficulty, q.category || null]
        );
      }
      
      await this.db!.runAsync(
        `UPDATE decks SET is_available_offline = 1, downloaded_at = ? WHERE id = ?`,
        [now, deckId]
      );
    });
  }

  async getOfflineDecks(): Promise<DeckRow[]> {
    if (!this.db) return [];
    return await this.db.getAllAsync<DeckRow>(
      `SELECT * FROM decks WHERE is_available_offline = 1 ORDER BY downloaded_at DESC`
    );
  }
  
  async getAllDecks(): Promise<DeckRow[]> {
    if (!this.db) return [];
    return await this.db.getAllAsync<DeckRow>(
      `SELECT * FROM decks ORDER BY last_synced_at DESC`
    );
  }

  async getQuestionsForDeck(deckId: string): Promise<QuestionRow[]> {
    if (!this.db) return [];
    return await this.db.getAllAsync<QuestionRow>(
      `SELECT * FROM questions WHERE deck_id = ? ORDER BY id`,
      [deckId]
    );
  }

  async updateProgress(questionId: string, deckId: string, status: 'attempted' | 'mastered') {
    if (!this.db) return;
    
    const now = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO user_progress (question_id, deck_id, status, last_attempted_at, attempt_count)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(question_id) DO UPDATE SET
         status = excluded.status,
         last_attempted_at = excluded.last_attempted_at,
         attempt_count = attempt_count + 1`,
      [questionId, deckId, status, now]
    );
  }

  async getProgressForDeck(deckId: string): Promise<{ total: number; attempted: number; mastered: number }> {
    if (!this.db) return { total: 0, attempted: 0, mastered: 0 };
    
    const total = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM questions WHERE deck_id = ?`,
      [deckId]
    );
    
    const attempted = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM user_progress WHERE deck_id = ? AND status = 'attempted'`,
      [deckId]
    );
    
    const mastered = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM user_progress WHERE deck_id = ? AND status = 'mastered'`,
      [deckId]
    );
    
    return {
      total: total?.count ?? 0,
      attempted: attempted?.count ?? 0,
      mastered: mastered?.count ?? 0,
    };
  }

  // Queue failed sync operations for retry
  async queueSyncOperation(endpoint: string, payload: Record<string, any>) {
    if (!this.db) return;
    await this.db.runAsync(
      `INSERT INTO offline_queue (endpoint, payload) VALUES (?, ?)`,
      [endpoint, JSON.stringify(payload)]
    );
  }

  async flushSyncQueue() {
    if (!this.db) return [];
    const items = await this.db.getAllAsync<{ id: number; endpoint: string; payload: string }>(
      `SELECT * FROM offline_queue ORDER BY created_at ASC LIMIT 50`
    );
    return items;
  }

  async removeSyncQueueItem(id: number) {
    if (!this.db) return;
    await this.db.runAsync(`DELETE FROM offline_queue WHERE id = ?`, [id]);
  }
}

export const offlineDB = new OfflineDatabase();
