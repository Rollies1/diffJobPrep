import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showPercentage?: boolean;
  delay?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 48,
  strokeWidth = 5,
  color,
  trackColor,
  showPercentage = true,
  delay = 0,
}) => {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const animatedProgress = useSharedValue(0);
  
  const ringColor = color || theme.semantic.success;
  const ringTrackColor = trackColor || (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    if (reducedMotion) {
      animatedProgress.value = progress;
    } else {
      animatedProgress.value = withDelay(
        delay,
        withTiming(progress, { duration: 1000, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [progress, reducedMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (animatedProgress.value / 100) * circumference,
  }));

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={ringTrackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      {showPercentage && (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <AnimatedPercentage value={animatedProgress} textColor={theme.text.primary} />
          </View>
        </View>
      )}
    </View>
  );
};

const AnimatedPercentage: React.FC<{ value: Animated.SharedValue<number>; textColor: string }> = ({ value, textColor }) => {
  const textProps = useAnimatedProps(() => ({
    text: `${Math.round(value.value)}%`,
  }));

  // Using Text component with animatedProps for percentage
  return (
    <Animated.Text 
      style={[styles.percentage, { color: textColor }]}
      // @ts-ignore - animatedProps on Text is supported by reanimated but Typescript complains
      animatedProps={textProps}
    >
      0%
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  percentage: {
    fontSize: 11,
    fontWeight: '700',
  },
});
