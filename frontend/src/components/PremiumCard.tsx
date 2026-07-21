import React from 'react';
import { View, StyleSheet, ViewProps, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface PremiumCardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export function PremiumCard({ children, style, onPress, ...props }: PremiumCardProps) {
  const theme = useTheme();

  const cardStyle = [
    styles.card, 
    { 
      backgroundColor: theme.surfaceOverlay,
      borderColor: theme.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  }
});
