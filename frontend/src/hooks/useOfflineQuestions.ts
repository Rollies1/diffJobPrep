import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService, QuestionFilter } from '../services/questionService';
import { offlineDb } from '../utils/offlineDb';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineSync } from './useOfflineSync';

const QUESTIONS_KEY = 'questions';
const OFFLINE_KEY = 'offline';

export function useOfflineQuestions(initialFilter: QuestionFilter = {}) {
  const { isOnline } = useNetworkStatus();
  const cacheQuestions = offlineDb.cacheQuestions;

  // Server query with fallback
  const serverQuery = useInfiniteQuery({
    queryKey: [QUESTIONS_KEY, initialFilter],
    queryFn: async ({ pageParam }: { pageParam?: unknown }) => {
      const cursor = typeof pageParam === 'string' ? pageParam : undefined;
      const result = await questionService.getQuestions({ ...initialFilter, cursor });
      // Cache for offline use
      await cacheQuestions(result.items.map((q: any) => ({ ...q, cachedAt: Date.now() })));
      return result;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 5,
    enabled: isOnline,
  });

  // Offline fallback query
  const offlineQuery = useQuery({
    queryKey: [QUESTIONS_KEY, OFFLINE_KEY, initialFilter],
    queryFn: async () => {
      const { data, total } = await offlineDb.getQuestions({
        type: initialFilter.type,
        difficulty: initialFilter.difficulty,
        topic: initialFilter.topic,
        bookmarked: initialFilter.bookmarked,
        search: initialFilter.search,
        limit: initialFilter.limit || 20,
        offset: 0,
      });
      return {
        pages: [{ data, total, page: 1, limit: 20, hasMore: false }],
        pageParams: [1],
      };
    },
    enabled: !isOnline && !serverQuery.isLoading,
    staleTime: Infinity,
  });

  // Map react-query properties depending on which query is active
  return isOnline ? serverQuery : offlineQuery as unknown as typeof serverQuery; // Cast to match InfiniteQuery payload if offline
}

export function useOfflineQuestion(id: string) {
  const { isOnline } = useNetworkStatus();

  const serverQuery = useQuery({
    queryKey: [QUESTIONS_KEY, id],
    queryFn: () => questionService.getQuestion(id),
    enabled: isOnline && !!id,
    staleTime: 1000 * 60 * 5,
  });

  const offlineQuery = useQuery({
    queryKey: [QUESTIONS_KEY, OFFLINE_KEY, id],
    queryFn: () => offlineDb.getQuestionById(id),
    enabled: !isOnline && !!id,
    staleTime: Infinity,
  });

  return isOnline ? serverQuery : offlineQuery;
}

export function useOfflineToggleBookmark() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({ id, bookmark }: { id: string; bookmark: boolean }) => {
      // Optimistic local update
      await offlineDb.toggleBookmarkLocal(id, bookmark);

      if (!isOnline) {
        // Queue for later sync
        await offlineDb.queueAction('toggleBookmark', { id, bookmark });
        return { queued: true };
      }

      await questionService.sync({
        deviceId: 'unknown', // Ideally from SecureStore
        clientLastSyncTimestamp: null,
        actions: [{ actionId: crypto.randomUUID(), type: 'BOOKMARK_TOGGLE', targetId: id, payload: { bookmark } }]
      });
      return { queued: false };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
    },
  });
}
