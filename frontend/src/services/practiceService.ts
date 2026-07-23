import apiClient from './apiClient';
import { z } from 'zod';

export const SessionAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.number().int().optional(),
  answerText: z.string().optional(),
  timeSpentMs: z.number().int().nonnegative(),
}).refine(data => data.selectedOption !== undefined || data.answerText !== undefined, {
  message: "Either selectedOption or answerText must be provided",
});

export const SyncPayloadSchema = z.object({
  clientSessionId: z.string().uuid(),
  deckId: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  answers: z.array(SessionAnswerSchema).min(1),
});

export interface SessionConfig {
  questionCount?: number;
  timeLimitMs?: number;
  adaptive?: boolean;
  /** Mirrors the backend StartPracticeRequest.Mode enum. */
  mode?: 'QUICK' | 'MOCK';
}

export interface StartSessionRequest {
  deckId: string;
  config?: SessionConfig;
}

export interface SessionQuestion {
  questionId: string;
  index: number;
  status: 'PENDING' | 'ANSWERED' | 'SKIPPED';
  timeLimitMs?: number;
  answeredAt?: string;
}

export interface SessionState {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  deckId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: SessionQuestion[];
  startedAt: string;
  expiresAt?: string;
}

export interface SubmitAnswerRequest {
  answerText: string;
  durationMs: number;
}

export interface SubmitAnswerResponse {
  accepted: boolean;
  nextAvailable: boolean;
}

export interface QuestionDto {
  id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
  category: string;
}

export interface NextQuestionResponse {
  hasMore: boolean;
  question?: QuestionDto;
}

export interface SessionResult {
  sessionId: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers?: number;
  durationMs: number;
  skillBreakdown?: Record<string, number>;
}

export const practiceService = {
  async startSession(request: StartSessionRequest): Promise<SessionState> {
    const { data } = await apiClient.post<SessionState>('/practice/sessions', request);
    return data;
  },

  async getSessionState(sessionId: string): Promise<SessionState> {
    const { data } = await apiClient.get<SessionState>(`/practice/sessions/${sessionId}`);
    return data;
  },

  async submitAnswer(sessionId: string, submission: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const { data } = await apiClient.post<SubmitAnswerResponse>(`/practice/sessions/${sessionId}/answers`, submission);
    return data;
  },

  async nextQuestion(sessionId: string): Promise<NextQuestionResponse> {
    const { data } = await apiClient.post<NextQuestionResponse>(`/practice/sessions/${sessionId}/next`);
    return data;
  },

  async completeSession(sessionId: string): Promise<SessionResult> {
    const { data } = await apiClient.post<SessionResult>(`/practice/sessions/${sessionId}/complete`);
    return data;
  },

  async abandonSession(sessionId: string): Promise<void> {
    await apiClient.post(`/practice/sessions/${sessionId}/abandon`);
  },

  async syncOfflineSessions(payload: z.infer<typeof SyncPayloadSchema>): Promise<SessionResult> {
    const validPayload = SyncPayloadSchema.parse(payload);
    const { data } = await apiClient.post<SessionResult>(`/practice/sync`, validPayload);
    return data;
  },
};
