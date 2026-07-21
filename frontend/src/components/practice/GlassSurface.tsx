import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeProvider';

interface GlassSurfaceProps {
  intensity?: number;
  children: React.ReactNode;
  style?: any;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  intensity = 20,
  children,
  style,
}) => {
  const theme = useTheme();

  // Android BlurView degrades to solid color below API 31
  const useSolidFallback = Platform.OS === 'android' && Platform.Version < 31;

  if (useSolidFallback) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.glass.backgroundStrong },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={theme.glass.tint as any}
      style={[styles.container, style]}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
