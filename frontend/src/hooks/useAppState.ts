import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { eventBus } from '../utils/eventBus';

export function useAppState() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        eventBus.emit('app:foreground');
      } else if (nextAppState.match(/inactive|background/)) {
        eventBus.emit('app:background');
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);
}
