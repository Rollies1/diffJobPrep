import { create } from 'zustand';

interface PracticeState {
  sessionId: string | null;
  deckId: string | null;
  currentIndex: number;
  startTime: number | null;
  answers: Record<string, string>;
  flaggedQuestions: Record<string, boolean>;
  startSession: (deckId: string) => string;
  submitAnswer: (questionId: string, answer: string, timeSpent: number) => void;
  endSession: () => void;
  initSession: (questionsCount: number) => void;
  setAnswer: (questionId: string, answer: string) => void;
  toggleFlag: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  sessionId: null,
  deckId: null,
  currentIndex: 0,
  startTime: null,
  answers: {},
  flaggedQuestions: {},
  startSession: (deckId) => {
    const sessionId = crypto.randomUUID();
    set({ sessionId, deckId });
    return sessionId;
  },
  submitAnswer: (questionId, answer, timeSpent) => {},
  endSession: () => {
    set({ sessionId: null, deckId: null });
  },
  initSession: (count) => set({ currentIndex: 0, startTime: Date.now(), answers: {}, flaggedQuestions: {} }),
  setAnswer: (questionId, answer) => set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  toggleFlag: (questionId) => set((state) => ({ flaggedQuestions: { ...state.flaggedQuestions, [questionId]: !state.flaggedQuestions[questionId] } })),
  nextQuestion: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),
  prevQuestion: () => set((state) => ({ currentIndex: Math.max(0, state.currentIndex - 1) })),
  setSubmitting: () => {},
}));
