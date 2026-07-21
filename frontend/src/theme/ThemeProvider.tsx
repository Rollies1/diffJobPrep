import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { themes, ThemeTokens, ThemeMode } from './tokens';
import { useAppearanceStore } from '../stores/useAppearanceStore';

/**
 * Unified theme provider.
 *
 * Derives the active palette from useAppearanceStore (light/dark/system),
 * which is persisted via SecureStore and toggled from the Profile screen.
 * Maps:  light  → daylight palette
 *        dark   → midnight palette
 *        system → follows the device color scheme
 *
 * This ensures the 32+ screens using useTheme() react to the same dark-mode
 * toggle as the 4 screens using useThemeColors().
 */
type ThemeContextType = ThemeTokens & {
  _meta: {
    current: ThemeMode;
    userPreference: ThemeMode | null;
    setTheme: (mode: ThemeMode | 'system') => Promise<void>;
    ready: boolean;
  };
};

const defaultThemeContext: ThemeContextType = {
  ...themes.midnight,
  _meta: {
    current: 'midnight' as ThemeMode,
    userPreference: null,
    setTheme: async () => {},
    ready: false,
  },
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  // appearanceMode is 'light' | 'dark' | 'system' (from useAppearanceStore)
  const appearanceMode = useAppearanceStore((s) => s.mode);
  const setAppearanceMode = useAppearanceStore((s) => s.setMode);
  const [ready, setReady] = useState(true); // appearance store is sync-persisted

  // Map appearance mode → token theme mode.
  const resolvedMode: ThemeMode =
    appearanceMode === 'dark'
      ? 'midnight'
      : appearanceMode === 'light'
        ? 'daylight'
        : systemScheme === 'light'
          ? 'daylight'
          : 'midnight';

  const tokens = themes[resolvedMode];

  // setTheme bridges the old ThemeMode | 'system' API to useAppearanceStore.
  const setTheme = async (mode: ThemeMode | 'system') => {
    if (mode === 'system') {
      setAppearanceMode('system');
    } else if (mode === 'daylight') {
      setAppearanceMode('light');
    } else {
      // midnight + oled both map to dark.
      setAppearanceMode('dark');
    }
  };

  const value: ThemeContextType = {
    ...tokens,
    _meta: {
      current: resolvedMode,
      userPreference: appearanceMode === 'system' ? null : (appearanceMode === 'dark' ? 'midnight' : 'daylight'),
      setTheme,
      ready,
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
