// @ts-nocheck
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, Users, Activity, Repeat, DollarSign, Server, Cpu, Database, CreditCard, TrendingUp, FlaskConical } from 'lucide-react-native'
import { ScreenHeader, StatTile } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

export default function AdminMetricsScreen({ onBack }: { onBack?: () => void }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ overflow: 'hidden', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <ScreenHeader title="Admin" subtitle="Analytics & A/B tests" onBack={onBack} variant="transparent"
            right={<View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>}
          />
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
            <FilterChip active>7 days</FilterChip>
            <FilterChip>30 days</FilterChip>
            <FilterChip>90 days</FilterChip>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* KPI grid */}
        <View style={styles.kpiGrid}>
          <StatTile label="DAU" value="8,420" sub="↑ 12.4%" accent="blue" icon={<Users size={14} color="#fff" />} />
          <StatTile label="Sessions" value="42.1k" sub="↑ 8.1%" accent="teal" icon={<Activity size={14} color="#fff" />} />
          <StatTile label="Retention" value="63%" sub="↑ 2.3%" accent="gold" icon={<Repeat size={14} color="#fff" />} />
          <StatTile label="Revenue" value="$48.2k" sub="↓ 1.2%" accent="orange" icon={<DollarSign size={14} color="#fff" />} />
        </View>

        {/* A/B tests */}
        <SectionLabel label="A/B tests" />
        <View style={{ gap: 10, paddingHorizontal: 16, marginTop: 8 }}>
          <ABTestCard name="Onboarding flow v2" variant="B" lift="+18.2%" control="42%" experiment="49.6%" status="winning" />
          <ABTestCard name="Paywall pricing tiers" variant="A" lift="+3.1%" control="12.4%" experiment="12.8%" status="running" />
        </View>

        {/* Service health */}
        <SectionLabel label="Service health" style={{ marginTop: 20 }} />
        <View style={styles.healthGrid}>
          <HealthCard icon={<Server size={16} color={colors.ink} />} label="API Gateway" status="operational" latency="42ms" />
          <HealthCard icon={<Cpu size={16} color={colors.ink} />} label="AI Service" status="operational" latency="180ms" />
          <HealthCard icon={<Database size={16} color={colors.ink} />} label="Database" status="degraded" latency="340ms" />
          <HealthCard icon={<CreditCard size={16} color={colors.ink} />} label="Payments" status="operational" latency="95ms" />
        </View>

        <Text style={styles.footer}>Last sync: 2 min ago · All times UTC</Text>
      </ScrollView>
    </View>
  )
}

function FilterChip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  if (active) {
    return (
      <View style={{ borderRadius: 999, overflow: 'hidden' }}>
        <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{children}</Text>
        </LinearGradient>
      </View>
    )
  }
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{children}</Text>
    </View>
  )
}

function SectionLabel({ label, style }: { label: string; style?: object }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      <Text style={styles.sectionLabelText}>{label}</Text>
      <View style={styles.sectionDivider} />
    </View>
  )
}

function ABTestCard({ name, variant, lift, control, experiment, status }: {
  name: string; variant: string; lift: string; control: string; experiment: string; status: 'winning' | 'running'
}) {
  const winning = status === 'winning'
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 12, overflow: 'hidden' }}>
          <LinearGradient colors={['#8b5cf6', colors.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical size={16} color="#fff" />
          </LinearGradient>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.abName}>{name}</Text>
          <Text style={styles.abVariant}>Variant {variant} vs Control</Text>
        </View>
        <View style={[styles.abStatus, { backgroundColor: winning ? colors.successBg : colors.warningBg }]}>
          <Text style={[styles.abStatusText, { color: winning ? colors.success : colors.warning }]}>{winning ? 'WINNING' : 'RUNNING'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <View style={styles.abCellControl}><Text style={styles.abCellLabel}>Control A</Text><Text style={styles.abCellValue}>{control}</Text></View>
        <View style={styles.abCellExp}><Text style={[styles.abCellLabel, { color: colors.blue }]}>Variant {variant}</Text><Text style={[styles.abCellValue, { color: colors.blue }]}>{experiment}</Text></View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={styles.abLiftLabel}>Conversion lift</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={12} color={colors.success} />
          <Text style={styles.abLiftValue}>{lift}</Text>
        </View>
      </View>
    </View>
  )
}

function HealthCard({ icon, label, status, latency }: { icon: React.ReactNode; label: string; status: 'operational' | 'degraded'; latency: string }) {
  const ok = status === 'operational'
  return (
    <View style={styles.healthCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={styles.healthIcon}>{icon}</View>
        <View style={[styles.healthDot, { backgroundColor: ok ? '#22c55e' : colors.amber }]} />
      </View>
      <Text style={styles.healthLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[styles.healthStatus, { color: ok ? colors.success : colors.warning }]}>{ok ? 'Operational' : 'Degraded'}</Text>
        <Text style={styles.healthLatency}>{latency}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: {},
  adminBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionLabelText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadows.card },
  abName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  abVariant: { fontSize: 10, color: colors.textSubtle },
  abStatus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  abStatusText: { fontSize: 9, fontWeight: '700' },
  abCellControl: { flex: 1, backgroundColor: '#f5f7fa', borderRadius: 12, padding: 10 },
  abCellExp: { flex: 1, backgroundColor: '#eef4ff', borderRadius: 12, padding: 10 },
  abCellLabel: { fontSize: 9, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase' },
  abCellValue: { fontSize: 15, fontWeight: '800', color: colors.textMuted, marginTop: 2 },
  abLiftLabel: { fontSize: 10, color: colors.textSubtle },
  abLiftValue: { fontSize: 12, fontWeight: '700', color: colors.success },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 8 },
  healthCard: { width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  healthIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center' },
  healthDot: { marginLeft: 'auto', width: 10, height: 10, borderRadius: 5 },
  healthLabel: { fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 8 },
  healthStatus: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  healthLatency: { fontSize: 10, color: colors.textSubtle, marginTop: 2 },
  footer: { textAlign: 'center', fontSize: 10, fontWeight: '600', color: colors.textSubtle, marginTop: 20 },
})
