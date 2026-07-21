import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme/ThemeProvider';

interface LottiePlayerProps {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
  onAnimationFinish?: () => void;
  placeholder?: React.ReactNode;
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  source,
  autoPlay = true,
  loop = false,
  style,
  onAnimationFinish,
  placeholder,
}) => {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Simulate async load for lazy initialization
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (reducedMotion) {
    // Static fallback — no animation, immediate render
    return (
      <View style={[styles.container, style]}>
        {placeholder ?? (
          <View style={styles.staticFallback}>
            <ActivityIndicator color={theme.semantic.success} />
          </View>
        )}
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.container, style]}>
        {placeholder ?? <ActivityIndicator color={theme.premium.gold} />}
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, style]}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        onAnimationFinish={onAnimationFinish}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        renderMode="HARDWARE" // Force GPU rendering
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
