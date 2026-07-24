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
  category: string | null;
  color_hex: string | null;
}

export interface QuestionRow {
  id: string;
  deck_id: string;
  question_text: string;
  answer_guidance: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string | null;
}

export interface DeckDifficultyCounts {
  easy: number;
  medium: number;
  hard: number;
}

export interface DeckCatalogEntry {
  id: string;
  title: string;
  subtitle?: string;
  isPremium: boolean;
  questionCount: number;
  category?: string | null;
  colorHex?: string | null;
}

export interface CategoryGroup {
  category: string;
  decks: DeckRow[];
}

class OfflineDatabase {
  public db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /** Open the DB and create/migrate tables. Idempotent — safe to call repeatedly. */
  async init() {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
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
          is_available_offline INTEGER DEFAULT 0,
          category TEXT,
          color_hex TEXT
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

      // Idempotent column migrations — SQLite throws "duplicate column name"
      // if the column already exists, so guard each one individually.
      await this.ensureColumn('decks', 'category', 'TEXT');
      await this.ensureColumn('decks', 'color_hex', 'TEXT');
    })();

    return this.initPromise;
  }

  /** Add a column to a table if it doesn't already exist. */
  private async ensureColumn(table: string, column: string, type: string) {
    if (!this.db) return;
    try {
      await this.db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    } catch {
      // Column already exists — safe to ignore.
    }
  }

  /** Make sure the DB is open before running any query. */
  private async ensure(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) await this.init();
    return this.db!;
  }

  async syncDecks(decks: DeckCatalogEntry[]) {
    const db = await this.ensure();

    const now = new Date().toISOString();

    for (const deck of decks) {
      await db.runAsync(
        `INSERT INTO decks (id, title, subtitle, is_premium, question_count, last_synced_at, category, color_hex)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           subtitle = excluded.subtitle,
           is_premium = excluded.is_premium,
           question_count = excluded.question_count,
           last_synced_at = excluded.last_synced_at,
           category = COALESCE(excluded.category, decks.category),
           color_hex = COALESCE(excluded.color_hex, decks.color_hex)`,
        [
          deck.id,
          deck.title,
          deck.subtitle || '',
          deck.isPremium ? 1 : 0,
          deck.questionCount,
          now,
          deck.category ?? null,
          deck.colorHex ?? null,
        ],
      );
    }
  }

  async downloadDeck(deckId: string, questions: QuestionRow[]) {
    const db = await this.ensure();

    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      for (const q of questions) {
        await db.runAsync(
          `INSERT INTO questions (id, deck_id, question_text, answer_guidance, difficulty, category)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             question_text = excluded.question_text,
             answer_guidance = excluded.answer_guidance,
             difficulty = excluded.difficulty,
             category = excluded.category`,
          [q.id, q.deck_id, q.question_text, q.answer_guidance || null, q.difficulty, q.category || null],
        );
      }

      await db.runAsync(
        `UPDATE decks SET is_available_offline = 1, downloaded_at = ? WHERE id = ?`,
        [now, deckId],
      );
    });
  }

  async getOfflineDecks(): Promise<DeckRow[]> {
    const db = await this.ensure();
    return await db.getAllAsync<DeckRow>(
      `SELECT * FROM decks WHERE is_available_offline = 1 ORDER BY downloaded_at DESC`,
    );
  }

  async getAllDecks(): Promise<DeckRow[]> {
    const db = await this.ensure();
    return await db.getAllAsync<DeckRow>(
      `SELECT * FROM decks ORDER BY last_synced_at DESC`,
    );
  }

  /**
   * Returns decks grouped by category, ordered by category name then deck title.
   * Decks with a null category are grouped under "Other".
   */
  async getDecksGroupedByCategory(): Promise<CategoryGroup[]> {
    const db = await this.ensure();
    const rows = await db.getAllAsync<DeckRow>(
      `SELECT * FROM decks
       ORDER BY COALESCE(category, 'Other') ASC, title ASC`,
    );

    const groups = new Map<string, DeckRow[]>();
    for (const row of rows) {
      const key = row.category ?? 'Other';
      const arr = groups.get(key) ?? [];
      arr.push(row);
      groups.set(key, arr);
    }

    return Array.from(groups.entries()).map(([category, decks]) => ({ category, decks }));
  }

  /**
   * Returns a map of deckId → {easy, medium, hard} question counts.
   * Single GROUP BY query — used by the Library screen to render the
   * difficulty summary badge on each deck card.
   */
  async getDeckDifficultyCounts(): Promise<Record<string, DeckDifficultyCounts>> {
    const db = await this.ensure();
    const rows = await db.getAllAsync<{
      deck_id: string;
      easy: number;
      medium: number;
      hard: number;
    }>(
      `SELECT deck_id,
         SUM(CASE WHEN LOWER(difficulty) = 'easy' THEN 1 ELSE 0 END) AS easy,
         SUM(CASE WHEN LOWER(difficulty) = 'medium' THEN 1 ELSE 0 END) AS medium,
         SUM(CASE WHEN LOWER(difficulty) = 'hard' THEN 1 ELSE 0 END) AS hard
       FROM questions
       GROUP BY deck_id`,
    );

    const map: Record<string, DeckDifficultyCounts> = {};
    for (const r of rows) {
      map[r.deck_id] = {
        easy: r.easy ?? 0,
        medium: r.medium ?? 0,
        hard: r.hard ?? 0,
      };
    }
    return map;
  }

  async getQuestionsForDeck(deckId: string): Promise<QuestionRow[]> {
    const db = await this.ensure();
    return await db.getAllAsync<QuestionRow>(
      `SELECT * FROM questions WHERE deck_id = ? ORDER BY id`,
      [deckId],
    );
  }

  async updateProgress(questionId: string, deckId: string, status: 'attempted' | 'mastered') {
    const db = await this.ensure();

    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO user_progress (question_id, deck_id, status, last_attempted_at, attempt_count)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(question_id) DO UPDATE SET
         status = excluded.status,
         last_attempted_at = excluded.last_attempted_at,
         attempt_count = attempt_count + 1`,
      [questionId, deckId, status, now],
    );
  }

  async getProgressForDeck(deckId: string): Promise<{ total: number; attempted: number; mastered: number }> {
    const db = await this.ensure();

    const total = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM questions WHERE deck_id = ?`,
      [deckId],
    );

    const attempted = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM user_progress WHERE deck_id = ? AND status = 'attempted'`,
      [deckId],
    );

    const mastered = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM user_progress WHERE deck_id = ? AND status = 'mastered'`,
      [deckId],
    );

    return {
      total: total?.count ?? 0,
      attempted: attempted?.count ?? 0,
      mastered: mastered?.count ?? 0,
    };
  }

  // Queue failed sync operations for retry
  async queueSyncOperation(endpoint: string, payload: Record<string, any>) {
    const db = await this.ensure();
    await db.runAsync(
      `INSERT INTO offline_queue (endpoint, payload) VALUES (?, ?)`,
      [endpoint, JSON.stringify(payload)],
    );
  }

  async flushSyncQueue() {
    const db = await this.ensure();
    const items = await db.getAllAsync<{ id: number; endpoint: string; payload: string }>(
      `SELECT * FROM offline_queue ORDER BY created_at ASC LIMIT 50`,
    );
    return items;
  }

  async removeSyncQueueItem(id: number) {
    const db = await this.ensure();
    await db.runAsync(`DELETE FROM offline_queue WHERE id = ?`, [id]);
  }
}

export const offlineDB = new OfflineDatabase();
