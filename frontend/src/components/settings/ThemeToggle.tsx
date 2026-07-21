import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing, radii } from '../../theme/tokens';
import { ThemeMode } from '../../theme/tokens';

export const ThemeToggle: React.FC = () => {
  const theme = useTheme();
  const { setTheme, current } = theme._meta;

  const options: Array<{ key: ThemeMode | 'system'; label: string; icon: string }> = [
    { key: 'midnight', label: 'Midnight', icon: 'moon' },
    { key: 'oled', label: 'OLED', icon: 'contrast' },
    { key: 'daylight', label: 'Daylight', icon: 'sunny' },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text.primary }]}>Appearance</Text>
      {options.map((option) => {
        const isActive = current === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => setTheme(option.key)}
            style={[
              styles.option,
              {
                backgroundColor: isActive
                  ? theme.premium.gold + '20'
                  : theme.surface,
                borderColor: isActive ? theme.premium.gold : theme.border,
              },
            ]}
          >
            <Ionicons
              name={option.icon as any}
              size={20}
              color={isActive ? theme.premium.gold : theme.text.secondary}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? theme.premium.gold : theme.text.primary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
            {isActive && (
              <Ionicons name="checkmark" size={18} color={theme.premium.gold} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
});
