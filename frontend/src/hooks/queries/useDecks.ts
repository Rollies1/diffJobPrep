import { useQuery } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { getDecks, upsertDecks } from '@/utils/database/repository';
import apiClient from '@/services/apiClient';
import type { components } from '@/types/questions';

type Deck = components['schemas']['DeckDto'];

export function useDecks() {
  const netInfo = useNetInfo();

  return useQuery<Deck[]>({
    queryKey: ['decks'],
    queryFn: async () => {
      // 1. Immediate local data
      const localRows = await getDecks();
      const local: Deck[] = localRows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        color: r.color,
        questionCount: r.question_count,
        completedCount: r.completed_count,
      }));

      // 2. Background server refresh if online
      if (netInfo.isConnected) {
        apiClient
          .get<Deck[]>('/questions/decks')
          .then(({ data }) => {
            if (data.length > 0) {
              // Normalize server DTO to SQLite schema
              const normalized = data.map((d) => ({
                id: d.id,
                title: d.title,
                category: d.category,
                color: d.color ?? '#00d4ff',
                question_count: d.questionCount ?? 0,
                completed_count: d.completedCount ?? 0,
                is_synced: 1,
              }));
              upsertDecks(normalized);
            }
          })
          .catch(() => {
            // Silently fail; local data is authoritative
          });
      }

      return local;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
  });
}
