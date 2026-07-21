import { useState, useEffect } from 'react';
import * as Device from 'expo-device';

type DeviceTier = 'high' | 'low';

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>('high');

  useEffect(() => {
    // Basic heuristic: check if it's a known low-end device or if it has low memory
    // In a real app, you might maintain a list of specific device models.
    const determineTier = async () => {
      // Assuming deviceYearClass is available or we use totalMemory
      const memory = Device.totalMemory;
      if (memory && memory < 3_000_000_000) { // Less than 3GB RAM is low-tier
        setTier('low');
      } else {
        setTier('high');
      }
    };
    
    determineTier();
  }, []);

  return tier;
}
