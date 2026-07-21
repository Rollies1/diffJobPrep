import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import { questionService, QuestionFilter } from '../services/questionService';

const QUESTIONS_KEY = 'questions';
const DECKS_KEY = 'decks';

export function useQuestions(initialFilter: QuestionFilter = {}) {
  return useInfiniteQuery({
    queryKey: [QUESTIONS_KEY, initialFilter],
    queryFn: ({ pageParam = 1 }) => questionService.getQuestions({ ...initialFilter, page: pageParam }),
    getNextPageParam: (lastPage: any) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDecks() {
  return useQuery({ queryKey: [DECKS_KEY], queryFn: () => questionService.getDecks() });
}

// Stubs to prevent UI compilation errors
export function useQuestion(id: string) { return useQuery({ queryKey: ['stub', id], queryFn: () => null }); }
export function useToggleBookmark() { return useMutation({ mutationFn: async () => {} }); }
export function useCheckAnswer() { return useMutation({ mutationFn: async () => {} }); }
export function useRateDifficulty() { return useMutation({ mutationFn: async () => {} }); }
export function useCreateDeck() { return useMutation({ mutationFn: async () => {} }); }
export function useDeckMutation() { return useMutation({ mutationFn: async () => {} }); }
export function useNotes(id: string) { return useQuery({ queryKey: ['stubNote', id], queryFn: () => [] }); }
export function useAddNote() { return useMutation({ mutationFn: async () => {} }); }
export function useDeleteNote() { return useMutation({ mutationFn: async () => {} }); }
export function useTimeline(id: string) { return useQuery({ queryKey: ['stubTimeline', id], queryFn: () => null }); }
