import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import apiClient from '@/services/apiClient';
import { usePracticeStore } from '@/stores/usePracticeStore';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { components } from '@/types/practice';

type SessionState = components['schemas']['SessionState'];
type StartSessionRequest = components['schemas']['StartSessionRequest'];
type SubmitAnswerRequest = components['schemas']['SubmitAnswerRequest'];
type SessionResult = components['schemas']['SessionResult'];
type NextQuestionResponse = components['schemas']['NextQuestionResponse'];

interface UsePracticeSessionReturn {
  sessionId: string | null;
  status: 'idle' | 'loading' | 'in_progress' | 'reviewing' | 'completed' | 'error';
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemainingMs: number | null;
  currentDifficulty: string | null;
  
  start: (deckId: string, config?: StartSessionRequest['config']) => Promise<void>;
  submitAnswer: (answerText: string, durationMs: number, correct: boolean) => Promise<void>;
  nextQuestion: () => Promise<void>;
  complete: () => Promise<SessionResult | null>;
  abandon: () => Promise<void>;
  
  canSubmit: boolean;
  isLastQuestion: boolean;
}

const DEFAULT_TIME_LIMIT_MS = 120000;

export function usePracticeSession(): UsePracticeSessionReturn {
  const queryClient = useQueryClient();
  const netInfo = useNetInfo();
  const reduceMotion = useReduceMotion();
  
  const [status, setStatus] = useState<UsePracticeSessionReturn['status']>('idle');
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const store = usePracticeStore();
  
  // ─── Start Session ─────────────────────────────────────
  const startMutation = useMutation({
    mutationFn: async ({ deckId, config }: { deckId: string; config?: StartSessionRequest['config'] }) => {
      if (!netInfo.isConnected) {
        // Option A: Block start if deck content is not cached locally
        const { getQuestionsByDeck } = await import('@/utils/database/repository');
        const localQuestions = await getQuestionsByDeck(deckId);
        
        if (!localQuestions || localQuestions.length === 0) {
          throw new Error('Deck content not available offline. Please connect to Wi-Fi to download this deck.');
        }

        const localSessionId = store.startSession(deckId, localQuestions.map(q => q.id));
        return { 
          id: localSessionId, 
          status: 'IN_PROGRESS' as const, 
          deckId, 
          currentQuestionIndex: 0, 
          totalQuestions: localQuestions.length, 
          questions: [],
          currentDifficulty: 'MEDIUM' 
        };
      }
      
      const { data } = await apiClient.post<SessionState & { currentDifficulty?: string }>('/practice/sessions', { deckId, config });
      return data;
    },
    onSuccess: (data) => {
      store.setSessionId(data.id);
      store.setDeckId(data.deckId);
      store.setTotalQuestions(data.totalQuestions);
      setCurrentDifficulty(data.currentDifficulty ?? 'MEDIUM');
      setStatus('in_progress');
      
      const currentQ = data.questions?.[data.currentQuestionIndex];
      startTimer(currentQ?.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: () => {
      setStatus('error');
    },
  });

  // ─── Submit Answer ─────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async ({ answerText, durationMs, correct }: { answerText: string; durationMs: number; correct: boolean }) => {
      const sessionId = store.sessionId;
      if (!sessionId) throw new Error('No active session');
      
      store.submitAnswer(answerText, durationMs, correct);
      
      if (!netInfo.isConnected) {
        return { accepted: true, nextAvailable: !store.isLastQuestion };
      }
      
      const { data } = await apiClient.post<{ accepted: boolean; nextAvailable: boolean }>(
        `/practice/sessions/${sessionId}/answers`,
        { answerText, durationMs, correct }
      );
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.accepted) {
        Haptics.notificationAsync(variables.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
        setStatus('reviewing');
        stopTimer();
        
        if (variables.correct && currentDifficulty === 'MEDIUM') {
          setCurrentDifficulty('HARD');
        } else if (!variables.correct && currentDifficulty === 'MEDIUM') {
          setCurrentDifficulty('EASY');
        }
      }
    },
  });

  // ─── Next Question ────────────────────────────────────
  const nextMutation = useMutation({
    mutationFn: async () => {
      const sessionId = store.sessionId;
      if (!sessionId) throw new Error('No active session');
      
      if (!netInfo.isConnected) {
        store.nextQuestion();
        return { hasMore: !store.isLastQuestion, question: null };
      }
      
      const { data } = await apiClient.post<NextQuestionResponse & { currentDifficulty?: string }>(
        `/practice/sessions/${sessionId}/next`
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.hasMore && data.question) {
        setStatus('in_progress');
        setCurrentDifficulty(data.currentDifficulty ?? currentDifficulty);
        store.nextQuestion();
        startTimer(data.question.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS);
      } else {
        setStatus('reviewing');
      }
    },
  });

  // ─── Complete Session ─────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: async () => {
      const sessionId = store.sessionId;
      if (!sessionId) throw new Error('No active session');
      
      if (!netInfo.isConnected) {
        const result = store.completeSession();
        
        // Save to offline repository for sync engine
        const { saveOfflinePracticeSession } = await import('@/utils/database/repository');
        await saveOfflinePracticeSession({
          clientSessionId: sessionId,
          deckId: store.deckId!,
          status: 'SYNC_QUEUED',
          answers: JSON.stringify(store.answers.map(ans => ({
            questionId: ans.questionId,
            selectedOption: ans.answerText.match(/^\d+$/) ? parseInt(ans.answerText, 10) : undefined,
            answerText: !ans.answerText.match(/^\d+$/) ? ans.answerText : undefined,
            durationMs: ans.durationMs
          }))),
          startedAt: new Date(Date.now() - store.answers.reduce((acc, a) => acc + a.durationMs, 0)).toISOString(), // Estimate
          completedAt: new Date().toISOString(),
          syncAttempts: 0,
        });

        return { sessionId, score: result.score, totalQuestions: result.score, answeredQuestions: result.score, durationMs: 0 } as SessionResult;
      }
      
      const { data } = await apiClient.post<SessionResult>(
        `/practice/sessions/${sessionId}/complete`
      );
      return data;
    },
    onSuccess: () => {
      setStatus('completed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'history'] });
    },
  });

  // ─── Abandon Session ──────────────────────────────────
  const abandonMutation = useMutation({
    mutationFn: async () => {
      const sessionId = store.sessionId;
      if (!sessionId) return;
      
      if (netInfo.isConnected) {
        await apiClient.post(`/practice/sessions/${sessionId}/abandon`);
      }
      
      store.abandonSession();
    },
    onSuccess: () => {
      setStatus('idle');
      stopTimer();
      setCurrentDifficulty(null);
    },
  });

  // ─── Timer Logic ──────────────────────────────────────
  const startTimer = useCallback((durationMs: number) => {
    stopTimer();
    setTimeRemainingMs(durationMs);
    
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeRemainingMs(remaining);
      
      if (remaining <= 0) {
        stopTimer();
        submitMutation.mutate({ answerText: '[TIMEOUT]', durationMs, correct: false });
      }
    }, 100);
  }, [submitMutation]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeRemainingMs(null);
  }, []);

  // ─── Public API ─────────────────────────────────────
  const start = useCallback(async (deckId: string, config?: StartSessionRequest['config']) => {
    setStatus('loading');
    await startMutation.mutateAsync({ deckId, config });
  }, [startMutation]);

  const submitAnswer = useCallback(async (answerText: string, durationMs: number, correct: boolean) => {
    await submitMutation.mutateAsync({ answerText, durationMs, correct });
  }, [submitMutation]);

  const nextQuestion = useCallback(async () => {
    await nextMutation.mutateAsync();
  }, [nextMutation]);

  const complete = useCallback(async () => {
    return await completeMutation.mutateAsync();
  }, [completeMutation]);

  const abandon = useCallback(async () => {
    await abandonMutation.mutateAsync();
  }, [abandonMutation]);

  return {
    sessionId: store.sessionId,
    status,
    currentQuestionIndex: store.currentQuestionIndex,
    totalQuestions: store.totalQuestions,
    timeRemainingMs,
    currentDifficulty,
    start,
    submitAnswer,
    nextQuestion,
    complete,
    abandon,
    canSubmit: status === 'in_progress' && !submitMutation.isPending,
    isLastQuestion: store.isLastQuestion,
  };
}
