import { useInfiniteQuery } from '@tanstack/react-query';
import { sessionService } from '@/services/sessionService';

export function useSessionHistory() {
  return useInfiniteQuery({
    queryKey: ['sessions', 'history'],
    queryFn: ({ pageParam }) => sessionService.getHistory(pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.nextCursor;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
  });
}
