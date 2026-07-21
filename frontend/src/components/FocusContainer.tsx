import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface FocusContainerProps extends ViewProps {
  intensity?: 'light' | 'deep';
  children: React.ReactNode;
}

export function FocusContainer({ intensity = 'light', children, style, ...props }: FocusContainerProps) {
  const theme = useTheme();

  const bgColor = intensity === 'deep'
    ? (colors.background as any).deep ?? theme.surfaceElevated
    : (colors.background as any).main ?? theme.background;

  return (
    <View 
      style={[styles.container, { backgroundColor: bgColor }, style]} 
      {...props}
    >
      <View 
        style={[
          styles.glowBackground, 
          { 
            backgroundColor: theme.semantic.info, 
            opacity: intensity === 'deep' ? 0.05 : 0.02,
          }
        ]} 
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    // Note: 'filter' is not supported in React Native StyleSheet
  },
});
