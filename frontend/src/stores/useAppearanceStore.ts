import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: async (name: string) => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => SecureStore.deleteItemAsync(name),
};

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppearanceState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'jp-appearance',
      storage: createJSONStorage(() => secureStorage as any), // Type cast for zustand storage compatibility
    }
  )
);
