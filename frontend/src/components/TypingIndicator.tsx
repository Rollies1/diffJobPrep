import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { useReduceMotion } from '../hooks/useReduceMotion';

function Dot({ index, color }: { index: number; color: string }) {
  const reduceMotion = useReduceMotion();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    translateY.value = withDelay(
      index * 150,
      withRepeat(
        withTiming(-6, { duration: 400 }),
        -1,
        true
      )
    );
  }, [reduceMotion, index, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: reduceMotion ? 1 : withDelay(index * 100, withTiming(1, { duration: 200 })),
  }));

  return (
    <Animated.View
      className="w-2 h-2 rounded-full mx-0.5"
      style={[
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export const TypingIndicator: React.FC = () => {
  const theme = useTheme();

  return (
    <View className="flex-row items-center px-4 py-3">
      <Dot index={0} color={theme.semantic.info} />
      <Dot index={1} color={theme.semantic.info} />
      <Dot index={2} color={theme.semantic.info} />
    </View>
  );
};
