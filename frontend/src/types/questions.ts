export interface components {
  schemas: {
    DeckDto: {
      id: string;
      title: string;
      category: string;
      color?: string;
      questionCount?: number;
      completedCount?: number;
    };
    QuestionDto: {
      id: string;
      deckId: string;
      title: string;
      content: string;
      difficulty: string;
      hint?: string;
      category?: string;
      bookmarked?: boolean;
      completed?: boolean;
    };
  };
}
