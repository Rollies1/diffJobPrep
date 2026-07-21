import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAdminMetrics } from '../../../src/hooks/useAdminMetrics';
import { SkiaMeshGradient } from '../../../src/components/backgrounds/SkiaMeshGradient';
import { MetricCard } from '../../../src/components/admin/MetricCard';
import { ABTestWidget } from '../../../src/components/admin/ABTestWidget';
import { HealthStatus } from '../../../src/components/admin/HealthStatus';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function AdminMetricsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, loading } = useAdminMetrics();

  return (
    <View style={styles.container}>
      {/* Background */}
      <SkiaMeshGradient>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme.text.primary} 
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text style={[styles.title, { color: theme.text.primary }]}>Executive Dashboard</Text>
            <View style={{ width: 24 }} />
          </View>

          {loading || !data ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.premium.gold} />
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeIn.duration(400)}>
                <ABTestWidget winner={data.abTest.winner} lift={data.abTest.lift} />

                <HealthStatus 
                  metrics={[
                    {
                      label: 'Offline Sync',
                      value: data.health.offlineSync,
                      target: 98,
                      type: 'higher_is_better',
                      unit: '%'
                    },
                    {
                      label: 'Perf Issues',
                      value: data.health.perfIssues,
                      target: 0,
                      type: 'lower_is_better',
                      unit: '/1k'
                    }
                  ]}
                />

                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Key Metrics</Text>
                
                {data.kpis.map((kpi) => (
                  <MetricCard key={kpi.id} kpi={kpi} />
                ))}
                
              </Animated.View>
            </ScrollView>
          )}
        </SafeAreaView>
      </SkiaMeshGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
  },
});
