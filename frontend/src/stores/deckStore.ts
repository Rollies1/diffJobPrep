import { create } from 'zustand';

interface DeckState {
  selectedQuestionIds: Set<string>;
  isMultiSelect: boolean;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  setMultiSelect: (val: boolean) => void;
  selectAll: (ids: string[]) => void;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  selectedQuestionIds: new Set(),
  isMultiSelect: false,

  toggleSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedQuestionIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedQuestionIds: next };
    }),

  clearSelection: () => set({ selectedQuestionIds: new Set() }),

  setMultiSelect: (val) => set({ isMultiSelect: val, selectedQuestionIds: new Set() }),

  selectAll: (ids) => set({ selectedQuestionIds: new Set(ids) }),
}));
