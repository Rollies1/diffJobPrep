import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  color?: string;
  label?: string;
  sublabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 100,
  strokeWidth = 10,
  progress,
  color: colorProp,
  label,
  sublabel,
}) => {
  const theme = useTheme();
  const progressSV = useSharedValue(0);
  const color = colorProp ?? theme.semantic.info;

  useEffect(() => {
    progressSV.value = withTiming(progress, { duration: 1200 });
  }, [progress, progressSV]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressSV.value),
  }));

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View className="absolute items-center">
        {label && (
          <Text
            className="text-lg font-bold"
            style={{ color: theme.text.primary, fontFamily: 'Inter_700Bold' }}
          >
            {label}
          </Text>
        )}
        {sublabel && (
          <Text
            className="text-xs"
            style={{ color: theme.text.muted, fontFamily: 'Inter_400Regular' }}
          >
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
};
