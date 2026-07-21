import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../src/theme/ThemeProvider';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { PremiumButton } from '../../src/components/PremiumButton';
import { springs, timings } from '../../src/animations/presets';

const { width } = Dimensions.get('window');

const slides = [
  { title: 'Offline-First Learning', description: 'Download your question bank and practice anywhere, even without internet.', icon: '⚡' },
  { title: 'AI-Powered Tutor', description: 'Get real-time feedback from our streaming AI assistant during mock interviews.', icon: '🤖' },
  { title: 'Track Your Progress', description: 'Visualize your improvement with detailed analytics and streak tracking.', icon: '📊' },
];

const PaginationDot = ({ index, activeIndexSV, theme }: { index: number, activeIndexSV: Animated.SharedValue<number>, theme: any }) => {
  const dotStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndexSV.value - index);
    const w = interpolate(distance, [0, 1, 2], [24, 8, 8]);
    const opacity = interpolate(distance, [0, 1, 2], [1, 0.4, 0.4]);
    const bg = interpolateColor(
      distance,
      [0, 1],
      [theme.semantic.info, theme.text.muted]
    );
    return { width: w, opacity, backgroundColor: bg };
  });

  return (
    <Animated.View
      className="h-2 rounded-full"
      style={dotStyle}
    />
  );
};

export default function OnboardingScreen() {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [index, setIndex] = useState(0);
  const direction = useSharedValue(1);
  const progress = useSharedValue(1);
  const activeIndexSV = useSharedValue(0);

  useEffect(() => {
    activeIndexSV.value = withSpring(index, springs.snappy);
  }, [index, activeIndexSV]);

  const animateTo = useCallback((nextIndex: number) => {
    const dir = nextIndex > index ? 1 : -1;
    direction.value = dir;

    if (reduceMotion) {
      setIndex(nextIndex);
      progress.value = 1;
      return;
    }

    progress.value = withTiming(0, timings.fast, () => {
      runOnJS(setIndex)(nextIndex);
      progress.value = withTiming(1, timings.slow);
    });
  }, [index, reduceMotion, direction, progress]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (index < slides.length - 1) {
      animateTo(index + 1);
    } else {
      router.replace('/(auth)/register');
    }
  }, [index, animateTo]);

  const skip = () => router.replace('/(auth)/register');

  const slideAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const translateX = interpolate(progress.value, [0, 1], [direction.value * 40, 0]);
    const scale = interpolate(progress.value, [0, 1], [0.96, 1]);
    return { opacity, transform: [{ translateX }, { scale }] };
  });

  const currentSlide = slides[index]!;

  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      className="flex-1"
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View className="flex-1">
        <Pressable onPress={skip} className="absolute top-14 right-6 z-10" accessibilityRole="button">
          <Text className="text-sm font-semibold" style={{ color: theme.text.muted, fontFamily: 'Inter_600SemiBold' }}>
            Skip
          </Text>
        </Pressable>

        <View className="flex-1 justify-center items-center px-8">
          <Animated.View style={slideAnimatedStyle} className="items-center">
            <View
              className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
              style={{
                backgroundColor: `${theme.semantic.info}12`,
                borderWidth: 1,
                borderColor: `${theme.semantic.info}25`,
              }}
            >
              <Text className="text-4xl">{currentSlide.icon}</Text>
            </View>

            <Text
              className="text-2xl font-bold text-center mb-3"
              style={{ color: theme.text.primary, fontFamily: 'Inter_700Bold' }}
            >
              {currentSlide.title}
            </Text>
            <Text
              className="text-base text-center leading-6"
              style={{ color: theme.text.secondary, fontFamily: 'Inter_400Regular' }}
            >
              {currentSlide.description}
            </Text>
          </Animated.View>
        </View>

        <View className="pb-12 px-6">
          <View className="flex-row justify-center mb-8 space-x-2">
            {slides.map((_, i) => (
              <PaginationDot key={i} index={i} activeIndexSV={activeIndexSV} theme={theme} />
            ))}
          </View>

          <PremiumButton
            title={index === slides.length - 1 ? 'Get Started' : 'Continue'}
            onPress={handleNext}
          />
        </View>
      </View>
    </LinearGradient>
  );
}
