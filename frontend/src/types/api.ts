/**
 * JobPrep API types — exact mirror of the Spring Boot DTOs.
 * Source of truth for the RN frontend ↔ backend contract.
 */

/* ── Auth & Users ─────────────────────────────────────────────── */

export interface UserDto {
  id: string
  email: string
  name: string
  username: string | null
  bio: string | null
  role: string
  avatarUrl: string | null
  onboardingComplete: boolean
  isPremium: boolean
  premiumExpiry: string | null
}

export interface AuthResponse {
  user: UserDto
  accessToken: string
  refreshToken: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  username?: string
  role?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ProfileUpdateRequest {
  username?: string
  name?: string
  bio?: string
  avatarUrl?: string
  onboardingComplete?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/* ── Questions & Decks ───────────────────────────────────────── */

export interface DeckDto {
  id: string
  title: string
  category: string
  color: string
  questionCount: number
  completedCount: number
}

export interface QuestionDto {
  id: string
  deckId: string
  title: string
  content: string
  difficulty: string // EASY | MEDIUM | HARD
  hint: string | null
  category: string
  /** Fine-grained sub-topic within the deck (e.g. "Hooks", "Closures"). */
  subTopic?: string | null
  options: string[]
  bookmarked: boolean
  completed: boolean
  rating: number | null
  notes: string | null
}

export interface PaginatedQuestionsResponse {
  data: QuestionDto[]
  nextCursor: string | null
}

/* ── Practice Sessions ───────────────────────────────────────── */

export interface SessionConfig {
  questionCount: number | null
  timeLimitMs: number | null
  adaptive: boolean | null
  /** Mirrors the backend StartPracticeRequest.Mode enum. Optional + defaulted. */
  mode?: 'QUICK' | 'MOCK'
}

export interface StartSessionRequest {
  deckId: string
  config: SessionConfig
}

export type SessionStatus =
  | 'CREATED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'EXPIRED'

export interface SessionQuestion {
  questionId: string
  index: number
  status: string // PENDING | ANSWERED | SKIPPED
  timeLimitMs: number | null
  answeredAt: string | null
}

export interface SessionState {
  id: string
  status: SessionStatus
  deckId: string
  currentQuestionIndex: number
  totalQuestions: number
  questions: SessionQuestion[]
  startedAt: string
  expiresAt: string | null
  currentDifficulty: string | null
}

export interface SubmitAnswerRequest {
  answerText: string
  durationMs: number
  correct?: boolean
  confidence?: number // 1-5
}

export interface SubmitAnswerResponse {
  accepted: boolean
  nextAvailable: boolean
}

export interface SessionResult {
  sessionId: string
  score: number
  totalQuestions: number
  answeredQuestions: number
  correctAnswers: number
  durationMs: number
  skillBreakdown: Record<string, number>
}

export interface SyncPayload {
  // Offline sync payload — shape depends on your SyncService; adjust to match.
  sessionId?: string
  deckId?: string
  answers: SubmitAnswerRequest[]
  startedAt: string
  completedAt: string
}

/* ── Analytics / Session Stats ───────────────────────────────── */

export interface UserStats {
  weeklyGoal: number
  completionRate: number
  streakDays: number
  totalAnswered: number
  weeklySessions: number
  weeklyQuestions: number
  skillBreakdown: Record<string, number>
  totalXp: number
  currentLevel: number
  xpInCurrentLevel: number
  xpToNextLevel: number
  rankName: string
}

export interface SessionHistoryItem {
  sessionId: string
  deckId: string
  deckName: string
  score: number
  totalQuestions: number
  answeredQuestions: number
  durationMs: number
  xpEarned: number
  completedAt: string
}

export interface CursorPage<T> {
  data: T[]
  nextCursor: string | null
}

export interface DailyActivityDto {
  date: string // ISO LocalDate
  sessionsCompleted: number
  questionsAnswered: number
  timeSpentSeconds: number
  scoreSum: number
  xpEarned: number
}

/* ── AI Service ──────────────────────────────────────────────── */

export interface EvaluationRequest {
  question: string
  answer: string
  category: string
}

export interface EvaluationResponse {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
  source: string
}

/* ── Sync (Question service) ─────────────────────────────────── */

export interface SyncRequest {
  // Batch sync for bookmarks/ratings/notes/completion state.
  changes: SyncChange[]
}

export interface SyncChange {
  questionId: string
  bookmarked?: boolean
  completed?: boolean
  rating?: number
  notes?: string
}

export interface SyncResponse {
  applied: number
  conflicts: string[]
}
