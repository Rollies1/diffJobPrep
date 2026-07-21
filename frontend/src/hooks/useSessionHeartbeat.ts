import { useEffect, useRef } from 'react';
import { usePracticeStore } from '../stores/practiceStore';
import { eventBus } from '../utils/eventBus';
import { useAppState } from './useAppState';

export function useSessionHeartbeat() {
  const sessionId = usePracticeStore((s) => s.sessionId);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleForeground = () => {
      if (sessionId && !intervalRef.current) {
        startHeartbeat();
      }
    };

    const handleBackground = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const unsubscribeFg = eventBus.on('app:foreground', handleForeground);
    const unsubscribeBg = eventBus.on('app:background', handleBackground);

    if (sessionId) startHeartbeat();

    return () => {
      unsubscribeFg();
      unsubscribeBg();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);

  const startHeartbeat = () => {
    intervalRef.current = setInterval(() => {
      // Send heartbeat to SessionService
      // This is a background ping, no need to await or handle response
      fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8089/api'}/sessions/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }, 30000);
  };
}
