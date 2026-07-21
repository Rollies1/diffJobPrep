import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const ABTestWidget: React.FC<{ winner: string; lift: number }> = ({ winner, lift }) => {
  const theme = useTheme();

  return (
    <Animated.View 
      entering={FadeInDown.delay(200).duration(500)}
      style={[styles.container, { backgroundColor: 'rgba(255, 215, 0, 0.05)', borderColor: 'rgba(255, 215, 0, 0.2)' }]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="flask" size={24} color={theme.premium.gold} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text.primary }]}>A/B Variant Winner</Text>
        <Text style={[styles.winner, { color: theme.premium.gold }]}>"{winner}"</Text>
      </View>
      <View style={styles.liftContainer}>
        <Text style={styles.liftText}>+{lift}%</Text>
        <Text style={[styles.liftLabel, { color: theme.text.muted }]}>Conversion Lift</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  winner: {
    fontSize: 18,
    fontWeight: '800',
  },
  liftContainer: {
    alignItems: 'flex-end',
  },
  liftText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#34C759',
  },
  liftLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
