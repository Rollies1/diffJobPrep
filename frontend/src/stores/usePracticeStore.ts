import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PracticeState {
  sessionId: string | null;
  deckId: string | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: Array<{ 
    questionId: string; 
    answerText: string; 
    durationMs: number;
    correct: boolean;
  }>;
  isLastQuestion: boolean;
  
  setSessionId: (id: string | null) => void;
  setDeckId: (id: string | null) => void;
  setTotalQuestions: (count: number) => void;
  startSession: (deckId: string, questionIds: string[]) => string;
  submitAnswer: (answerText: string, durationMs: number, correct: boolean) => void;
  nextQuestion: () => void;
  completeSession: () => { sessionId: string; score: number };
  abandonSession: () => void;
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      deckId: null,
      currentQuestionIndex: 0,
      totalQuestions: 0,
      answers: [],
      isLastQuestion: false,

      setSessionId: (id) => set({ sessionId: id }),
      setDeckId: (id) => set({ deckId: id }),
      setTotalQuestions: (count) => set({ totalQuestions: count }),

      startSession: (deckId, questionIds) => {
        const sessionId = crypto.randomUUID();
        set({
          sessionId,
          deckId,
          currentQuestionIndex: 0,
          totalQuestions: questionIds.length || 10,
          answers: [],
          isLastQuestion: (questionIds.length || 10) <= 1,
        });
        return sessionId;
      },

      submitAnswer: (answerText, durationMs, correct) => {
        const { currentQuestionIndex, answers } = get();
        set({
          answers: [
            ...answers,
            {
              questionId: `q-${currentQuestionIndex}`,
              answerText,
              durationMs,
              correct,
            },
          ],
        });
      },

      nextQuestion: () => {
        const { currentQuestionIndex, totalQuestions } = get();
        const nextIndex = currentQuestionIndex + 1;
        set({
          currentQuestionIndex: nextIndex,
          isLastQuestion: nextIndex >= totalQuestions - 1,
        });
      },

      completeSession: () => {
        const { sessionId, answers, totalQuestions } = get();
        const correctCount = answers.filter(a => a.correct).length;
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        
        set({
          sessionId: null,
          currentQuestionIndex: 0,
          totalQuestions: 0,
          answers: [],
          isLastQuestion: false,
        });
        
        return { sessionId: sessionId!, score };
      },

      abandonSession: () => {
        set({
          sessionId: null,
          deckId: null,
          currentQuestionIndex: 0,
          totalQuestions: 0,
          answers: [],
          isLastQuestion: false,
        });
      },
    }),
    {
      name: 'practice-session',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
