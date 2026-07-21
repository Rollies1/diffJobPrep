import * as SQLite from 'expo-sqlite';

const DB_NAME = 'learning_app.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initSchema();
  }
  return db;
}

async function initSchema() {
  const database = await getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      topic TEXT NOT NULL,
      tags TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT,
      explanation TEXT,
      code_template TEXT,
      language TEXT,
      matching_pairs TEXT,
      media_urls TEXT,
      is_bookmarked INTEGER DEFAULT 0,
      cached_at INTEGER NOT NULL,
      last_synced INTEGER
    );

    CREATE TABLE IF NOT EXISTS pending_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
    CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
    CREATE INDEX IF NOT EXISTS idx_questions_bookmarked ON questions(is_bookmarked);
  `);
}

export interface CachedQuestion {
  id: string;
  type: string;
  title: string;
  content: string;
  difficulty: string;
  topic: string;
  tags: string[];
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  codeTemplate?: string;
  language?: string;
  matchingPairs?: { left: string; right: string }[];
  mediaUrls?: string[];
  isBookmarked: boolean;
  cachedAt: number;
}

export const offlineDb = {
  async cacheQuestions(questions: CachedQuestion[]): Promise<void> {
    const database = await getDb();
    const now = Date.now();

    await database.withTransactionAsync(async () => {
      for (const q of questions) {
        await database.runAsync(
          `INSERT OR REPLACE INTO questions (
            id, type, title, content, difficulty, topic, tags, options,
            correct_answer, explanation, code_template, language,
            matching_pairs, media_urls, is_bookmarked, cached_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            q.id,
            q.type,
            q.title,
            q.content,
            q.difficulty,
            q.topic,
            JSON.stringify(q.tags),
            q.options ? JSON.stringify(q.options) : null,
            q.correctAnswer || null,
            q.explanation || null,
            q.codeTemplate || null,
            q.language || null,
            q.matchingPairs ? JSON.stringify(q.matchingPairs) : null,
            q.mediaUrls ? JSON.stringify(q.mediaUrls) : null,
            q.isBookmarked ? 1 : 0,
            now,
          ]
        );
      }
    });
  },

  async getQuestions(filter: {
    type?: string;
    difficulty?: string;
    topic?: string;
    bookmarked?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: CachedQuestion[]; total: number }> {
    const database = await getDb();
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filter.type) {
      conditions.push('type = ?');
      params.push(filter.type);
    }
    if (filter.difficulty) {
      conditions.push('difficulty = ?');
      params.push(filter.difficulty);
    }
    if (filter.topic) {
      conditions.push('topic = ?');
      params.push(filter.topic);
    }
    if (filter.bookmarked) {
      conditions.push('is_bookmarked = 1');
    }
    if (filter.search) {
      conditions.push('(title LIKE ? OR content LIKE ? OR topic LIKE ?)');
      const search = `%${filter.search}%`;
      params.push(search, search, search);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM questions WHERE ${whereClause}`,
      params
    );
    const total = countResult?.count || 0;

    // Get paginated results
    const limit = filter.limit || 20;
    const offset = filter.offset || 0;

    const rows = await database.getAllAsync<any>(
      `SELECT * FROM questions WHERE ${whereClause} ORDER BY cached_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const data = rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      difficulty: row.difficulty,
      topic: row.topic,
      tags: JSON.parse(row.tags),
      options: row.options ? JSON.parse(row.options) : undefined,
      correctAnswer: row.correct_answer || undefined,
      explanation: row.explanation || undefined,
      codeTemplate: row.code_template || undefined,
      language: row.language || undefined,
      matchingPairs: row.matching_pairs ? JSON.parse(row.matching_pairs) : undefined,
      mediaUrls: row.media_urls ? JSON.parse(row.media_urls) : undefined,
      isBookmarked: row.is_bookmarked === 1,
      cachedAt: row.cached_at,
    }));

    return { data, total };
  },

  async getQuestionById(id: string): Promise<CachedQuestion | null> {
    const database = await getDb();
    const row = await database.getFirstAsync<any>(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      difficulty: row.difficulty,
      topic: row.topic,
      tags: JSON.parse(row.tags),
      options: row.options ? JSON.parse(row.options) : undefined,
      correctAnswer: row.correct_answer || undefined,
      explanation: row.explanation || undefined,
      codeTemplate: row.code_template || undefined,
      language: row.language || undefined,
      matchingPairs: row.matching_pairs ? JSON.parse(row.matching_pairs) : undefined,
      mediaUrls: row.media_urls ? JSON.parse(row.media_urls) : undefined,
      isBookmarked: row.is_bookmarked === 1,
      cachedAt: row.cached_at,
    };
  },

  async toggleBookmarkLocal(id: string, bookmarked: boolean): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'UPDATE questions SET is_bookmarked = ? WHERE id = ?',
      [bookmarked ? 1 : 0, id]
    );
  },

  async queueAction(actionType: string, payload: Record<string, any>): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'INSERT INTO pending_actions (action_type, payload, created_at) VALUES (?, ?, ?)',
      [actionType, JSON.stringify(payload), Date.now()]
    );
  },

  async getPendingActions(): Promise<{ id: number; actionType: string; payload: any }[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM pending_actions ORDER BY created_at ASC'
    );
    return rows.map((row) => ({
      id: row.id,
      actionType: row.action_type,
      payload: JSON.parse(row.payload),
    }));
  },

  async removePendingAction(id: number): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM pending_actions WHERE id = ?', [id]);
  },

  async clearCache(): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM questions');
    await database.runAsync('DELETE FROM pending_actions');
  },
};
