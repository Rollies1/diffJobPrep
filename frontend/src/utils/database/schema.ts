export const MIGRATIONS = [
  // ─── V1: Base Schema ─────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#00d4ff',
    question_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0,
    server_updated_at TEXT,
    local_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_synced INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
    hint TEXT,
    category TEXT,
    server_updated_at TEXT,
    local_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_synced INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS user_question_state (
    question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    bookmarked INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    last_practiced_at TEXT,
    server_updated_at TEXT,
    local_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_synced INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS pending_actions (
    action_id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL CHECK(action_type IN (
      'BOOKMARK_TOGGLE', 'QUESTION_COMPLETE', 'RATE_QUESTION', 'DECK_PROGRESS'
    )),
    target_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    client_timestamp TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_questions_deck ON questions(deck_id);
  CREATE INDEX IF NOT EXISTS idx_state_synced ON user_question_state(is_synced);
  CREATE INDEX IF NOT EXISTS idx_pending_created ON pending_actions(created_at);
  `,
  
  // ─── V2: Add session cache ─────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    score INTEGER,
    duration_ms INTEGER,
    answers TEXT,
    is_synced INTEGER NOT NULL DEFAULT 0
  );
  `,
  
  // ─── V3: Add options for multiple-choice ─────────────────
  `
  ALTER TABLE questions ADD COLUMN options TEXT;
  `,

  // ─── V4: Upgrade offline practice sessions ─────────────────
  `
  ALTER TABLE practice_sessions ADD COLUMN sync_status TEXT DEFAULT 'PENDING';
  ALTER TABLE practice_sessions ADD COLUMN sync_attempts INTEGER DEFAULT 0;
  ALTER TABLE practice_sessions ADD COLUMN last_sync_error TEXT;
  `,

  // ─── V5: Add SessionService analytics cache ────────────────
  `
  CREATE TABLE IF NOT EXISTS user_stats (
    user_id TEXT PRIMARY KEY,
    weekly_goal REAL NOT NULL,
    completion_rate REAL NOT NULL,
    streak_days INTEGER NOT NULL,
    total_answered INTEGER NOT NULL,
    weekly_sessions INTEGER NOT NULL,
    weekly_questions INTEGER NOT NULL,
    skill_breakdown TEXT NOT NULL,
    total_xp INTEGER NOT NULL,
    current_level INTEGER NOT NULL,
    xp_in_current_level INTEGER NOT NULL,
    xp_to_next_level INTEGER NOT NULL,
    rank_name TEXT NOT NULL,
    local_updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS session_history (
    session_id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    deck_name TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answered_questions INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    completed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_activity (
    date TEXT PRIMARY KEY,
    sessions_completed INTEGER NOT NULL,
    questions_answered INTEGER NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    score_sum INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL
  );
  `
];
