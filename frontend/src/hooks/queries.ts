import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { authService } from '../services/auth'
import { questionService } from '../services/questions'
import { practiceService } from '../services/practice'
import { statsService } from '../services/stats'
import { aiService } from '../services/ai'
import { useAuthStore } from '../store/useAuthStore'
import type {
  RegisterRequest,
  LoginRequest,
  StartSessionRequest,
  SubmitAnswerRequest,
  EvaluationRequest,
  SyncRequest,
} from '../types/api'

/* ── Auth ────────────────────────────────────────────────────── */

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (body: LoginRequest) => authService.login(body),
    onSuccess: (res) => {
      void setAuth(res.user, res.accessToken, res.refreshToken)
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (body: RegisterRequest) => authService.register(body),
    onSuccess: (res) => {
      void setAuth(res.user, res.accessToken, res.refreshToken)
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      void logout()
      qc.clear()
    },
  })
}

/* ── Questions & Decks ───────────────────────────────────────── */

export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: questionService.getDecks,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: questionService.getCategories,
  })
}

export function useQuestion(questionId: string | null) {
  return useQuery({
    queryKey: ['question', questionId],
    queryFn: () => questionService.getQuestion(questionId!),
    enabled: !!questionId,
  })
}

/** Infinite-scroll questions in a deck (cursor pagination). */
export function useDeckQuestions(deckId: string | null, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['deck-questions', deckId],
    queryFn: ({ pageParam }) =>
      questionService.getQuestions(deckId!, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!deckId,
  })
}

/* ── Practice ────────────────────────────────────────────────── */

export function useStartSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: StartSessionRequest) => practiceService.start(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-state'] }),
  })
}

export function useSessionState(sessionId: string | null) {
  return useQuery({
    queryKey: ['session-state', sessionId],
    queryFn: () => practiceService.getState(sessionId!),
    enabled: !!sessionId,
    // Poll while in progress so the UI advances after submit/next.
    refetchInterval: (query) => {
      const state = query.state.data
      return state && state.status === 'IN_PROGRESS' ? 2000 : false
    },
  })
}

/** Fetch the question at the session's current index. */
export function useSessionQuestion(sessionState: { currentQuestionIndex: number; questions: { questionId: string }[] } | undefined) {
  const qid = sessionState?.questions?.[sessionState.currentQuestionIndex]?.questionId ?? null
  return useQuery({
    queryKey: ['question', qid],
    queryFn: () => questionService.getQuestion(qid!),
    enabled: !!qid,
  })
}

export function useNextQuestion(sessionId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => practiceService.next(sessionId!),
    onSuccess: () => {
      if (sessionId) qc.invalidateQueries({ queryKey: ['session-state', sessionId] })
    },
  })
}

export function useSubmitAnswer(sessionId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitAnswerRequest) =>
      practiceService.submitAnswer(sessionId!, body),
    onSuccess: () => {
      if (sessionId) qc.invalidateQueries({ queryKey: ['session-state', sessionId] })
    },
  })
}

export function useCompleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => practiceService.complete(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['history'] })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

/* ── Stats ───────────────────────────────────────────────────── */

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: statsService.getStats })
}

export function useHistory(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['history'],
    queryFn: ({ pageParam }) => statsService.getHistory(pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function useActivity(days = 7) {
  return useQuery({
    queryKey: ['activity', days],
    queryFn: () => statsService.getActivity(days),
  })
}

/* ── AI ──────────────────────────────────────────────────────── */

export function useEvaluate() {
  return useMutation({
    mutationFn: (body: EvaluationRequest) => aiService.evaluate(body),
  })
}
