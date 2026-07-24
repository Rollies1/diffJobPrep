import { api } from './api'
import type {
  DeckDto,
  QuestionDto,
  PaginatedQuestionsResponse,
  SyncRequest,
  SyncResponse,
} from '../types/api'

export const questionService = {
  /** GET /questions/decks — public, no auth required. */
  getDecks: async (): Promise<DeckDto[]> => {
    const { data } = await api.get<DeckDto[]>('/questions/decks')
    return data
  },

  /** GET /questions/decks/{deckId}/questions?cursor=&limit=20 — cursor pagination. */
  getQuestions: async (
    deckId: string,
    cursor?: string | null,
    limit = 20
  ): Promise<PaginatedQuestionsResponse> => {
    const { data } = await api.get<PaginatedQuestionsResponse>(
      `/questions/decks/${deckId}/questions`,
      { params: { cursor: cursor ?? undefined, limit } }
    )
    return data
  },

  /** GET /questions/{questionId} — global data; user state merged client-side. */
  getQuestion: async (questionId: string): Promise<QuestionDto> => {
    const { data } = await api.get<QuestionDto>(`/questions/${questionId}`)
    return data
  },

  /** GET /questions/categories */
  getCategories: async (): Promise<string[]> => {
    const { data } = await api.get<string[]>('/questions/categories')
    return data
  },

  /** POST /questions/sync — batch sync bookmarks/ratings/notes/completion. */
  sync: async (body: SyncRequest): Promise<SyncResponse> => {
    const { data } = await api.post<SyncResponse>('/questions/sync', body)
    return data
  },

  /**
   * GET /questions/random?categoryId=&deckId=&difficulty=&count=
   * Returns lightweight question slots for ad-hoc practice sessions.
   * categoryId / deckId / difficulty are all optional; count defaults to 5.
   * difficulty, when provided, must be 'EASY' | 'MEDIUM' | 'HARD'.
   */
  getRandomQuestions: async (opts: {
    categoryId?: string
    deckId?: string
    difficulty?: string
    count?: number
  }): Promise<{ questionId: string; questionText: string; expectedKeywords?: string[] }[]> => {
    const { data } = await api.get('/questions/random', {
      params: {
        categoryId: opts.categoryId,
        deckId: opts.deckId,
        difficulty: opts.difficulty,
        count: opts.count ?? 5,
      },
    })
    return data
  },
}
