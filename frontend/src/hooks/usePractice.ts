import { useMutation, useQuery } from '@tanstack/react-query';
import { practiceService, SessionConfig } from '../services/practiceService';
import { usePracticeStore } from '../stores/practiceStore';
import { saveOfflinePracticeSession } from '@/utils/database/repository';
import { getDatabase } from '@/utils/database/connection';

const PRACTICE_KEY = 'practice';

export function useCreateSession() {
  const startSession = usePracticeStore((s) => s.startSession);

  return useMutation({
    mutationFn: async (deckId: string) => {
      const sessionId = startSession(deckId);
      await saveOfflinePracticeSession({
        clientSessionId: sessionId,
        deckId: deckId,
        status: 'SYNC_QUEUED',
        answers: '[]',
        startedAt: new Date().toISOString(),
        syncAttempts: 0,
      });
      return { id: sessionId, mode: 'practice' };
    },
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: [PRACTICE_KEY, 'session', sessionId],
    queryFn: () => practiceService.getSessionState(sessionId),
    enabled: !!sessionId,
    staleTime: Infinity,
  });
}

export function useSubmitAnswer() {
  const submitAnswerStore = usePracticeStore((s) => s.submitAnswer);

  return useMutation({
    mutationFn: async (submission: { sessionId: string; questionId: string; answer: string; timeSpent: number }) => {
      submitAnswerStore(submission.questionId, submission.answer, submission.timeSpent);
      
      const db = await getDatabase();
      const current = await db.getFirstAsync<{ answers: string }>(
        'SELECT answers FROM practice_sessions WHERE id = ?', 
        [submission.sessionId]
      );
      
      if (current) {
        const answersArr = JSON.parse(current.answers || '[]');
        answersArr.push({ 
          questionId: submission.questionId, 
          answerText: submission.answer, 
          durationMs: submission.timeSpent 
        });
        await db.runAsync('UPDATE practice_sessions SET answers = ? WHERE id = ?', [JSON.stringify(answersArr), submission.sessionId]);
      }
      
      return { correct: true };
    },
  });
}

export function useCompleteSession() {
  const endSession = usePracticeStore((s) => s.endSession);

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const db = await getDatabase();
      // Dummy score calc for offline
      const score = 85; 
      await db.runAsync(
        'UPDATE practice_sessions SET completed_at = ?, score = ? WHERE id = ?', 
        [new Date().toISOString(), score, sessionId]
      );
      return { sessionId, score, totalQuestions: 10, answeredQuestions: 8, durationMs: 120000 };
    },
    onSuccess: () => {
      endSession();
    },
  });
}

export function useAbandonSession() {
  const endSession = usePracticeStore((s) => s.endSession);

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Just mark completed for now
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE practice_sessions SET completed_at = ? WHERE id = ?', 
        [new Date().toISOString(), sessionId]
      );
    },
    onSuccess: () => {
      endSession();
    },
  });
}
