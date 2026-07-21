import { getDatabase } from './connection';

export interface DeckRow {
  id: string;
  title: string;
  category: string;
  color: string;
  question_count: number;
  completed_count: number;
  is_synced: number;
}

export interface QuestionRow {
  id: string;
  deck_id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string | null;
  category: string | null;
  options: string | null; // JSON string
  bookmarked: number;
  completed: number;
}

export interface PendingActionRow {
  action_id: string;
  action_type: 'BOOKMARK_TOGGLE' | 'QUESTION_COMPLETE' | 'RATE_QUESTION' | 'DECK_PROGRESS';
  target_id: string;
  payload: string;
  client_timestamp: string;
}

export interface OfflinePracticeSession {
  clientSessionId: string;
  deckId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SYNC_QUEUED' | 'SYNCED' | 'SYNC_FAILED';
  answers: string; // JSON string of SessionAnswer[]
  startedAt: string;
  completedAt?: string;
  syncAttempts: number;
  lastSyncError?: string;
}

// ─── Deck Operations ─────────────────────────────────────
export async function getDecks(): Promise<DeckRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<DeckRow>(`
    SELECT d.*, 
      COUNT(q.id) as question_count,
      SUM(COALESCE(uqs.completed, 0)) as completed_count
    FROM decks d
    LEFT JOIN questions q ON q.deck_id = d.id
    LEFT JOIN user_question_state uqs ON uqs.question_id = q.id
    GROUP BY d.id
    ORDER BY d.local_updated_at DESC
  `);
}

export async function upsertDecks(decks: DeckRow[]) {
  const db = await getDatabase();
  const stmt = await db.prepareAsync(`
    INSERT INTO decks (id, title, category, color, server_updated_at, is_synced)
    VALUES ($id, $title, $category, $color, $server_updated_at, 1)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      category = excluded.category,
      color = excluded.color,
      server_updated_at = excluded.server_updated_at,
      is_synced = 1,
      local_updated_at = CURRENT_TIMESTAMP
  `);

  try {
    for (const deck of decks) {
      await stmt.executeAsync({
        $id: deck.id,
        $title: deck.title,
        $category: deck.category,
        $color: deck.color,
        $server_updated_at: new Date().toISOString(),
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

// ─── Question Operations ─────────────────────────────────
export async function getQuestionsByDeck(deckId: string): Promise<QuestionRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<QuestionRow>(`
    SELECT q.*, COALESCE(uqs.bookmarked, 0) as bookmarked, COALESCE(uqs.completed, 0) as completed
    FROM questions q
    LEFT JOIN user_question_state uqs ON uqs.question_id = q.id
    WHERE q.deck_id = $deckId
    ORDER BY q.local_updated_at DESC
  `, { $deckId: deckId });
}

export async function upsertQuestions(questions: Array<{
  id: string;
  deck_id: string;
  title: string;
  content: string;
  difficulty: string;
  hint?: string;
  category?: string;
  options?: string[] | null;
}>) {
  const db = await getDatabase();
  const stmt = await db.prepareAsync(`
    INSERT INTO questions (id, deck_id, title, content, difficulty, hint, category, options, server_updated_at, is_synced)
    VALUES ($id, $deck_id, $title, $content, $difficulty, $hint, $category, $options, $server_updated_at, 1)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      difficulty = excluded.difficulty,
      hint = excluded.hint,
      category = excluded.category,
      options = excluded.options,
      server_updated_at = excluded.server_updated_at,
      is_synced = 1,
      local_updated_at = CURRENT_TIMESTAMP
  `);

  try {
    for (const q of questions) {
      await stmt.executeAsync({
        $id: q.id,
        $deck_id: q.deck_id,
        $title: q.title,
        $content: q.content,
        $difficulty: q.difficulty,
        $hint: q.hint ?? null,
        $category: q.category ?? null,
        $options: q.options ? JSON.stringify(q.options) : null,
        $server_updated_at: new Date().toISOString(),
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

// ─── Bookmark / State Operations ─────────────────────────
export async function toggleBookmark(questionId: string, currentState: boolean): Promise<PendingActionRow> {
  const db = await getDatabase();
  const newState = currentState ? 0 : 1;

  await db.runAsync(`
    INSERT INTO user_question_state (question_id, bookmarked, local_updated_at, is_synced)
    VALUES ($questionId, $bookmarked, CURRENT_TIMESTAMP, 0)
    ON CONFLICT(question_id) DO UPDATE SET
      bookmarked = excluded.bookmarked,
      local_updated_at = CURRENT_TIMESTAMP,
      is_synced = 0
  `, { $questionId: questionId, $bookmarked: newState });

  const action: PendingActionRow = {
    action_id: crypto.randomUUID(),
    action_type: 'BOOKMARK_TOGGLE',
    target_id: questionId,
    payload: JSON.stringify({ bookmarked: !!newState }),
    client_timestamp: new Date().toISOString(),
  };

  await db.runAsync(`
    INSERT INTO pending_actions (action_id, action_type, target_id, payload, client_timestamp)
    VALUES ($actionId, $actionType, $targetId, $payload, $timestamp)
  `, {
    $actionId: action.action_id,
    $actionType: action.action_type,
    $targetId: action.target_id,
    $payload: action.payload,
    $timestamp: action.client_timestamp,
  });

  return action;
}

// ─── Pending Actions ────────────────────────────────────
export async function getPendingActions(): Promise<PendingActionRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<PendingActionRow>(`
    SELECT * FROM pending_actions 
    ORDER BY client_timestamp ASC
  `);
}

export async function clearPendingActions(actionIds: string[]) {
  const db = await getDatabase();
  const placeholders = actionIds.map(() => '?').join(',');
  await db.runAsync(
    `DELETE FROM pending_actions WHERE action_id IN (${placeholders})`,
    actionIds
  );
}

export async function markSynced(targetIds: string[], table: 'questions' | 'user_question_state') {
  const db = await getDatabase();
  const placeholders = targetIds.map(() => '?').join(',');
  const idColumn = table === 'questions' ? 'id' : 'question_id';
  
  await db.runAsync(
    `UPDATE ${table} SET is_synced = 1 WHERE ${idColumn} IN (${placeholders})`,
    targetIds
  );
}

// ─── Practice Sessions (Offline) ────────────────────────
export async function getSessionsByStatus(status: string): Promise<OfflinePracticeSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(`
    SELECT * FROM practice_sessions WHERE sync_status = $status
  `, { $status: status });
  return rows.map(r => ({
    clientSessionId: r.id,
    deckId: r.deck_id,
    status: r.sync_status,
    answers: r.answers,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    syncAttempts: r.sync_attempts,
    lastSyncError: r.last_sync_error,
  }));
}

export async function updateSessionStatus(clientSessionId: string, status: string, error?: string) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE practice_sessions SET sync_status = $status, last_sync_error = COALESCE($error, last_sync_error) WHERE id = $id`, { $status: status, $id: clientSessionId, $error: error ?? null });
}

export async function scheduleRetry(clientSessionId: string) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE practice_sessions SET sync_attempts = sync_attempts + 1, sync_status = 'SYNC_QUEUED' WHERE id = $id`, { $id: clientSessionId });
}

export async function saveOfflinePracticeSession(session: OfflinePracticeSession) {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT INTO practice_sessions (id, deck_id, started_at, completed_at, answers, sync_status, sync_attempts, last_sync_error)
    VALUES ($id, $deck_id, $started_at, $completed_at, $answers, $sync_status, $sync_attempts, $last_sync_error)
    ON CONFLICT(id) DO UPDATE SET
      completed_at = excluded.completed_at,
      answers = excluded.answers,
      sync_status = excluded.sync_status,
      sync_attempts = excluded.sync_attempts,
      last_sync_error = excluded.last_sync_error
  `, {
    $id: session.clientSessionId,
    $deck_id: session.deckId,
    $started_at: session.startedAt,
    $completed_at: session.completedAt ?? null,
    $answers: session.answers,
    $sync_status: session.status,
    $sync_attempts: session.syncAttempts,
    $last_sync_error: session.lastSyncError ?? null,
  });
}

// ─── SessionService Analytics (Offline) ─────────────────

export async function getUserStats(userId: string): Promise<any | null> {
  const db = await getDatabase();
  return db.getFirstAsync(`SELECT * FROM user_stats WHERE user_id = $userId`, { $userId: userId });
}

export async function upsertUserStats(userId: string, stats: any) {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT INTO user_stats (
      user_id, weekly_goal, completion_rate, streak_days, total_answered, 
      weekly_sessions, weekly_questions, skill_breakdown, total_xp, 
      current_level, xp_in_current_level, xp_to_next_level, rank_name, local_updated_at
    ) VALUES (
      $user_id, $weekly_goal, $completion_rate, $streak_days, $total_answered,
      $weekly_sessions, $weekly_questions, $skill_breakdown, $total_xp,
      $current_level, $xp_in_current_level, $xp_to_next_level, $rank_name, CURRENT_TIMESTAMP
    ) ON CONFLICT(user_id) DO UPDATE SET
      weekly_goal = excluded.weekly_goal,
      completion_rate = excluded.completion_rate,
      streak_days = excluded.streak_days,
      total_answered = excluded.total_answered,
      weekly_sessions = excluded.weekly_sessions,
      weekly_questions = excluded.weekly_questions,
      skill_breakdown = excluded.skill_breakdown,
      total_xp = excluded.total_xp,
      current_level = excluded.current_level,
      xp_in_current_level = excluded.xp_in_current_level,
      xp_to_next_level = excluded.xp_to_next_level,
      rank_name = excluded.rank_name,
      local_updated_at = CURRENT_TIMESTAMP
  `, {
    $user_id: userId,
    $weekly_goal: stats.weeklyGoal,
    $completion_rate: stats.completionRate,
    $streak_days: stats.streakDays,
    $total_answered: stats.totalAnswered,
    $weekly_sessions: stats.weeklySessions,
    $weekly_questions: stats.weeklyQuestions,
    $skill_breakdown: JSON.stringify(stats.skillBreakdown),
    $total_xp: stats.totalXp,
    $current_level: stats.currentLevel,
    $xp_in_current_level: stats.xpInCurrentLevel,
    $xp_to_next_level: stats.xpToNextLevel,
    $rank_name: stats.rankName
  });
}

export async function getSessionHistory(): Promise<any[]> {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT * FROM session_history ORDER BY completed_at DESC LIMIT 50`);
}

export async function upsertSessionHistory(items: any[]) {
  const db = await getDatabase();
  const stmt = await db.prepareAsync(`
    INSERT INTO session_history (
      session_id, deck_id, deck_name, score, total_questions, 
      answered_questions, duration_ms, xp_earned, completed_at
    ) VALUES (
      $session_id, $deck_id, $deck_name, $score, $total_questions,
      $answered_questions, $duration_ms, $xp_earned, $completed_at
    ) ON CONFLICT(session_id) DO UPDATE SET
      deck_name = excluded.deck_name,
      score = excluded.score,
      total_questions = excluded.total_questions,
      answered_questions = excluded.answered_questions,
      duration_ms = excluded.duration_ms,
      xp_earned = excluded.xp_earned,
      completed_at = excluded.completed_at
  `);
  try {
    for (const item of items) {
      await stmt.executeAsync({
        $session_id: item.sessionId,
        $deck_id: item.deckId,
        $deck_name: item.deckName ?? null,
        $score: item.score,
        $total_questions: item.totalQuestions,
        $answered_questions: item.answeredQuestions,
        $duration_ms: item.durationMs,
        $xp_earned: item.xpEarned,
        $completed_at: item.completedAt
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function getDailyActivity(): Promise<any[]> {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT * FROM daily_activity ORDER BY date DESC LIMIT 30`);
}

export async function upsertDailyActivity(activities: any[]) {
  const db = await getDatabase();
  const stmt = await db.prepareAsync(`
    INSERT INTO daily_activity (
      date, sessions_completed, questions_answered, time_spent_seconds, score_sum, xp_earned
    ) VALUES (
      $date, $sessions_completed, $questions_answered, $time_spent_seconds, $score_sum, $xp_earned
    ) ON CONFLICT(date) DO UPDATE SET
      sessions_completed = excluded.sessions_completed,
      questions_answered = excluded.questions_answered,
      time_spent_seconds = excluded.time_spent_seconds,
      score_sum = excluded.score_sum,
      xp_earned = excluded.xp_earned
  `);
  try {
    for (const item of activities) {
      await stmt.executeAsync({
        $date: item.date,
        $sessions_completed: item.sessionsCompleted,
        $questions_answered: item.questionsAnswered,
        $time_spent_seconds: item.timeSpentSeconds,
        $score_sum: item.scoreSum,
        $xp_earned: item.xpEarned
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }
}
