import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { sessionService } from '../services/sessionService';

const SESSION_KEY = 'sessions';

export function useStats() {
  return useQuery({
    queryKey: [SESSION_KEY, 'stats'],
    queryFn: () => sessionService.getStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useActivity(days: number = 7) {
  return useQuery({
    queryKey: [SESSION_KEY, 'activity', days],
    queryFn: () => sessionService.getActivity(days),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useHistory() {
  return useInfiniteQuery({
    queryKey: [SESSION_KEY, 'history'],
    queryFn: ({ pageParam }) => sessionService.getHistory(pageParam),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });
}
