import { useQuery } from '@tanstack/react-query';
import { sessionService } from '@/services/sessionService';

export function useDailyActivity(days: number = 7) {
  return useQuery({
    queryKey: ['activity', days],
    queryFn: () => sessionService.getActivity(days),
    staleTime: 1000 * 60 * 10, // 10 mins
  });
}
