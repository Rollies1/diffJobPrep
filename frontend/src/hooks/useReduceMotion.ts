import { useState, useEffect } from 'react';

// Very basic hook that checks if reduce motion is preferred.
// In a full app, this might use AccessibilityInfo from React Native.
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  
  // Real implementation would attach to OS accessibility preferences
  
  return reduceMotion;
}
