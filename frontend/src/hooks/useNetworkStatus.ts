import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // We rely primarily on NetInfo as it's highly reliable in React Native
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null initially, so we default to isConnected
      const online = state.isInternetReachable ?? state.isConnected ?? true;
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
}
