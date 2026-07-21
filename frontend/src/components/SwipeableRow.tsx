import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { springs } from '../animations/presets';

interface SwipeableRowProps {
  children: React.ReactNode;
  onBookmark: () => void;
  bookmarked?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onBookmark,
  bookmarked,
}) => {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = -80;
  const MAX_DRAG = -140;

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onChange((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, MAX_DRAG);
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-90, springs.snappy);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onBookmark)();
        // Snap back after visual confirmation
        translateX.value = withDelay(400, withSpring(0, springs.gentle));
      } else {
        translateX.value = withSpring(0, springs.gentle);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="relative mb-3 overflow-hidden rounded-jp-md">
      {/* Background Action Layer */}
      <View
        className="absolute inset-0 flex-row items-center justify-end pr-6"
        style={{
          backgroundColor: bookmarked ? theme.premium.purple : theme.semantic.info,
        }}
      >
        <Text
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: theme.isDark ? '#000000' : '#ffffff', fontFamily: 'Inter_700Bold' }}
        >
          {bookmarked ? 'Saved' : 'Bookmark'}
        </Text>
      </View>

      {/* Foreground Content */}
      <GestureDetector gesture={pan}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};
