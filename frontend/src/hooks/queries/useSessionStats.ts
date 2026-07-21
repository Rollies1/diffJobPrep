import { useQuery } from '@tanstack/react-query';
import { sessionService } from '@/services/sessionService';

export function useSessionStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => sessionService.getStats(),
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}
