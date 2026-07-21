import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme/ThemeProvider';

interface SuccessBurstProps {
  visible: boolean;
  onComplete?: () => void;
}

export const SuccessBurst: React.FC<SuccessBurstProps> = ({ visible, onComplete }) => {
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && !reducedMotion) {
      // Expanding circle animation
      scale.value = 0;
      opacity.value = 0.5;
      borderOpacity.value = 1;
      
      scale.value = withTiming(2, { duration: 600, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
      borderOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
      
      const timer = setTimeout(() => onComplete?.(), 600);
      return () => clearTimeout(timer);
    }
  }, [visible, reducedMotion]);

  if (reducedMotion) return null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    borderColor: theme.semantic.success,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.2 }],
    opacity: borderOpacity.value,
    borderColor: theme.semantic.success,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <Animated.View style={[styles.ring, animatedStyle, { backgroundColor: theme.semantic.success }]} />
      <Animated.View style={[styles.borderRing, borderStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  borderRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});
