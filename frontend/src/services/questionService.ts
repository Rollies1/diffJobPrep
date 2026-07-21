import apiClient from './apiClient';
import { adaptPaginated, Paginated } from './adapters/springPageAdapter';
import type { components } from '@/types/questions';
import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string(),
  deckId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  difficulty: z.string().optional(),
  hint: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  options: z.array(z.string()).nullable().optional(),
}).passthrough();

export const PaginatedQuestionsSchema = z.object({
  data: z.array(QuestionSchema).optional().nullable(),
  nextCursor: z.string().optional().nullable(),
}).passthrough();

type BaseDeck = components['schemas']['DeckDto'];
export type StudyDeck = BaseDeck & {
  name?: string;
  questionIds?: string[];
};

export type Question = z.infer<typeof QuestionSchema> & {
  type?: 'mcq' | 'code' | 'fill_blank' | 'matching' | 'essay';
  correctAnswer?: string; // Kept for types but won't come from server
  codeTemplate?: string;
  language?: string;
  matchingPairs?: { left: string; right: string }[];
  mediaUrls?: string[];
  bookmarked?: boolean;
  completed?: boolean;
};

export type PaginatedQuestions = Paginated<Question>;

export type SyncRequest = {
  clientLastSyncTimestamp?: string | null;
  deviceId: string;
  actions: any[];
};
export type SyncResponse = {
  acknowledgedActionIds: string[];
  serverChanges: any[];
};
export interface QuestionFilter {
  page?: number;
  limit?: number;
  type?: string;
  difficulty?: string;
  topic?: string;
  search?: string;
  bookmarked?: boolean;
  deckId?: string;
  cursor?: string;
}

export const questionService = {
  // ─── Read-Only Queries ─────────────────────────────
  
  getDecks: () =>
    apiClient.get<StudyDeck[]>('/questions/decks').then(res => res.data),

  getQuestions: async (filter: QuestionFilter = {}) => {
    // If deckId is provided, route there, otherwise generic
    const url = filter.deckId ? `/questions/decks/${filter.deckId}/questions` : '/questions';
    const res = await apiClient.get(url, {
      params: { limit: filter.limit || 20, cursor: filter.cursor },
    });
    
    // Zod validation at runtime
    const parsed = PaginatedQuestionsSchema.parse(res.data);
    
    return adaptPaginated<Question>(parsed);
  },

  // Fallback for single question if absolutely needed
  getQuestion: (id: string) =>
    apiClient.get<Question>(`/questions/${id}`).then(res => res.data),

  // ─── Unified Mutation (offline-first sync) ─────────
  
  sync: (payload: SyncRequest) =>
    apiClient.post<SyncResponse>('/questions/sync', payload).then(res => res.data),
};
