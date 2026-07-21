export interface components {
  schemas: {
    StartSessionRequest: {
      deckId: string;
      config?: {
        questionCount?: number;
        timeLimitMs?: number;
        adaptive?: boolean;
      };
    };
    SessionState: {
      id: string;
      status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
      deckId: string;
      currentQuestionIndex: number;
      totalQuestions: number;
      questions: Array<{
        questionId: string;
        index: number;
        status: string;
        timeLimitMs?: number;
        answeredAt?: string;
      }>;
      startedAt?: string;
      expiresAt?: string;
    };
    SubmitAnswerRequest: {
      answerText: string;
      durationMs: number;
    };
    SubmitAnswerResponse: {
      accepted: boolean;
      nextAvailable: boolean;
    };
    NextQuestionResponse: {
      hasMore: boolean;
      question?: {
        id: string;
        title: string;
        content: string;
        difficulty: string;
        hint?: string;
        category?: string;
        timeLimitMs?: number;
      } | null;
    };
    SessionResult: {
      sessionId: string;
      score: number;
      totalQuestions: number;
      answeredQuestions: number;
      correctAnswers?: number;
      durationMs: number;
      skillBreakdown?: Record<string, number>;
    };
  };
}
