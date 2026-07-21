import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { KPI } from '../../hooks/useAdminMetrics';
import { ProgressRing } from '../library/ProgressRing';

export const MetricCard: React.FC<{ kpi: KPI }> = ({ kpi }) => {
  const theme = useTheme();

  // Progress is current / target * 100
  const progress = Math.min((kpi.current / kpi.target) * 100, 100);
  const isMeetingTarget = kpi.current >= kpi.target;
  const statusColor = isMeetingTarget ? theme.semantic.success : theme.semantic.info;

  const displayValue = kpi.format === 'currency' 
    ? `$${kpi.current.toFixed(2)}` 
    : kpi.format === 'percentage' 
      ? `${kpi.current}%` 
      : kpi.current.toString();

  const targetValue = kpi.format === 'currency'
    ? `$${kpi.target.toFixed(2)}`
    : kpi.format === 'percentage'
      ? `${kpi.target}%`
      : kpi.target.toString();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.text.secondary }]}>{kpi.label}</Text>
        <Ionicons name={kpi.trend === 'up' ? 'trending-up' : 'trending-down'} size={18} color={kpi.trend === 'up' ? theme.semantic.success : theme.semantic.error} />
      </View>
      
      <View style={styles.contentRow}>
        <View style={styles.valueContainer}>
          <Text style={[styles.currentValue, { color: theme.text.primary }]}>{displayValue}</Text>
          <Text style={[styles.trendValue, { color: kpi.trend === 'up' ? theme.semantic.success : theme.semantic.error }]}>
            {kpi.trendValue}
          </Text>
        </View>
        <View style={styles.ringContainer}>
          <ProgressRing 
            progress={progress} 
            size={56} 
            strokeWidth={5} 
            color={statusColor} 
            showPercentage={false}
          />
          <View style={styles.ringInner}>
            <Text style={[styles.targetLabel, { color: theme.text.muted }]}>TGT</Text>
            <Text style={[styles.targetValue, { color: theme.text.secondary }]}>{targetValue}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  valueContainer: {
    flex: 1,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  targetValue: {
    fontSize: 11,
    fontWeight: '700',
  },
});
