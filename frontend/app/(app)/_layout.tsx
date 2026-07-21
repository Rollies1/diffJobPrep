import React from 'react';
import { Stack } from 'expo-router';
import { BreathingGradient } from '../../src/components/backgrounds/BreathingGradient';

export default function AppLayout() {
  return (
    <BreathingGradient intensity="subtle">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      />
    </BreathingGradient>
  );
}
