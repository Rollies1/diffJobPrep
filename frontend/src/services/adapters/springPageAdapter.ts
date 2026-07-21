export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function adaptPaginated<T>(raw: any): Paginated<T> {
  return {
    items: raw.data ?? raw.content ?? [],
    nextCursor: raw.nextCursor ?? null,
    hasMore: !!raw.nextCursor,
  };
}

import { CursorPage } from '../sessionService';

export function adaptCursorPage<T>(cursorPage: CursorPage<T>): Paginated<T> {
  return {
    items: cursorPage.data,
    nextCursor: cursorPage.nextCursor,
    hasMore: cursorPage.hasMore,
  };
}
