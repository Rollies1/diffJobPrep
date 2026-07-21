import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeTokens, ThemeMode } from './tokens';

const THEME_STORAGE_KEY = '@jobprep/theme_preference';

type ThemeContextType = ThemeTokens & {
  _meta: {
    current: ThemeMode;
    userPreference: ThemeMode | null;
    setTheme: (mode: ThemeMode | 'system') => Promise<void>;
    ready: boolean;
  };
};

const defaultThemeContext = {
  ...themes.midnight,
  _meta: {
    current: 'midnight' as ThemeMode,
    userPreference: null as ThemeMode | null,
    setTheme: async () => {},
    ready: false,
  }
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [userPreference, setUserPreference] = useState<ThemeMode | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored && ['midnight', 'oled', 'daylight'].includes(stored)) {
        setUserPreference(stored as ThemeMode);
      }
      setReady(true);
    });
  }, []);

  const setTheme = async (mode: ThemeMode | 'system') => {
    if (mode === 'system') {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      setUserPreference(null);
    } else {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setUserPreference(mode);
    }
  };

  const resolvedMode: ThemeMode =
    userPreference ?? (systemScheme === 'light' ? 'daylight' : 'midnight');

  const tokens = themes[resolvedMode];

  const value = {
    ...tokens,
    _meta: {
      current: resolvedMode,
      userPreference,
      setTheme,
      ready,
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
