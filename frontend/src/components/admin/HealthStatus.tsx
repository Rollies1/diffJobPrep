import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface HealthProps {
  label: string;
  value: number;
  target: number;
  type: 'higher_is_better' | 'lower_is_better';
  unit: string;
}

export const HealthStatus: React.FC<{ metrics: HealthProps[] }> = ({ metrics }) => {
  const theme = useTheme();

  return (
    <Animated.View 
      entering={FadeInDown.delay(300).duration(500)}
      style={styles.container}
    >
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>System Health</Text>
      
      <View style={styles.grid}>
        {metrics.map((m, idx) => {
          const isHealthy = m.type === 'higher_is_better' 
            ? m.value >= m.target 
            : m.value <= m.target;
            
          const statusColor = isHealthy ? theme.semantic.success : theme.semantic.error;
          const statusIcon = isHealthy ? 'checkmark-circle' : 'warning';

          return (
            <View key={idx} style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: `${statusColor}15` }]}>
                <Ionicons name={statusIcon} size={18} color={statusColor} />
              </View>
              <View style={styles.content}>
                <Text style={[styles.label, { color: theme.text.secondary }]}>{m.label}</Text>
                <Text style={[styles.value, { color: theme.text.primary }]}>
                  {m.value}{m.unit}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
});
