import { useQuery } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { getQuestionsByDeck, upsertQuestions } from '@/utils/database/repository';
import { questionService } from '@/services/questionService';
import type { components } from '@/types/questions';

type Question = components['schemas']['QuestionDto'];

export function useDeckDetail(deckId: string) {
  const netInfo = useNetInfo();

  return useQuery<Question[]>({
    queryKey: ['questions', deckId],
    queryFn: async () => {
      const localRows = await getQuestionsByDeck(deckId);
      const local: Question[] = localRows.map((r) => ({
        id: r.id,
        deckId: r.deck_id,
        title: r.title,
        content: r.content,
        difficulty: r.difficulty,
        hint: r.hint ?? undefined,
        bookmarked: !!r.bookmarked,
        completed: !!r.completed,
      }));

      if (netInfo.isConnected) {
        questionService
          .getQuestions({ deckId, limit: 100 })
          .then(({ items }) => {
            if (items.length > 0) {
              upsertQuestions(
                items.map((q) => ({
                  id: q.id,
                  deck_id: q.deckId!,
                  title: q.title!,
                  content: q.content!,
                  difficulty: q.difficulty!,
                  hint: q.hint ?? undefined,
                  category: q.category ?? undefined,
                  options: q.options ?? undefined,
                }))
              );
            }
          })
          .catch(() => {});
      }

      return local;
    },
    enabled: !!deckId,
    staleTime: 1000 * 60 * 3,
  });
}
