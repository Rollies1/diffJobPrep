import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from '../analytics/posthog';

const MAX_TOKENS = 5;
const TOKEN_KEY = 'session_tokens';
const LAST_RESET_KEY = 'tokens_last_reset';

/**
 * Soft token system: Informational only, never blocks practice.
 * Resets at midnight local time. Used for engagement metrics and
 * gentle upsell prompts, not hard gates.
 */
export function useSessionTokens() {
  const [tokens, setTokensState] = useState(MAX_TOKENS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);
      const today = new Date().toDateString();
      
      if (lastReset !== today) {
        // New day — reset tokens
        await AsyncStorage.setItem(TOKEN_KEY, String(MAX_TOKENS));
        await AsyncStorage.setItem(LAST_RESET_KEY, today);
        setTokensState(MAX_TOKENS);
      } else {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        const count = stored ? parseInt(stored, 10) : MAX_TOKENS;
        setTokensState(Math.max(0, count));
      }
    } catch {
      setTokensState(MAX_TOKENS);
    } finally {
      setIsLoading(false);
    }
  };

  const consumeToken = useCallback(async () => {
    setTokensState(prev => {
      const next = Math.max(0, prev - 1);
      AsyncStorage.setItem(TOKEN_KEY, String(next));
      
      if (next === 0) {
        analytics.tokenDepleted('session_end');
      }
      
      return next;
    });
  }, []);

  const getTokensRemaining = useCallback(() => tokens, [tokens]);

  return {
    tokens,
    isLoading,
    consumeToken,
    getTokensRemaining,
    maxTokens: MAX_TOKENS,
  };
}
