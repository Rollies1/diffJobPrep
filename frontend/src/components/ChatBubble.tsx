import React, { useEffect } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { springs } from '../animations/presets';

interface ChatBubbleProps {
  children: React.ReactNode;
  sender: 'user' | 'ai';
  style?: ViewStyle;
  index: number;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  children,
  sender,
  style,
  index,
}) => {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
    } else {
      progress.value = withDelay(index * 80, withSpring(1, springs.gentle));
    }
  }, [reduceMotion, index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const translateY = interpolate(progress.value, [0, 1], [20, 0]);
    const scale = interpolate(progress.value, [0, 1], [0.95, 1]);

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const isUser = sender === 'user';

  return (
    <Animated.View
      style={[
        {
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          marginBottom: 12,
        },
        animatedStyle,
      ]}
    >
      <View
        className="rounded-jp-md px-4 py-3"
        style={[
          {
            backgroundColor: isUser
              ? theme.semantic.info
              : theme.surfaceOverlay,
            borderWidth: isUser ? 0 : 1,
            borderColor: isUser ? 'transparent' : theme.border,
            borderBottomRightRadius: isUser ? 4 : 24,
            borderBottomLeftRadius: isUser ? 24 : 4,
          },
          style,
        ]}
      >
        {isUser ? (
          <Text
            className="text-base leading-6"
            style={{
              color: theme.isDark ? '#000000' : '#ffffff',
              fontFamily: 'Inter_400Regular',
            }}
          >
            {children}
          </Text>
        ) : (
          <View>{children}</View>
        )}
      </View>
    </Animated.View>
  );
};
