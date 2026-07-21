import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Shuffle, Target, Timer, Sliders, ChevronRight, Zap, Clock, Award } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, SectionTitle } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

const QUICK_CARDS = [
  { tint: [colors.blue, colors.teal] as string[], title: 'Random mix', desc: '10 mixed Qs', emoji: '🎲' },
  { tint: [colors.teal, colors.tealGreen] as string[], title: 'Weak spots', desc: 'Auto-targeted', emoji: '🎯' },
  { tint: [colors.gold, colors.amber] as string[], title: 'Timed mock', desc: '45-min interview', emoji: '⏱️' },
  { tint: [colors.amber, colors.orange] as string[], title: 'Custom', desc: 'Build your own', emoji: '⚙️' },
]

export default function PracticeSetupScreen({
  onStartQuick,
  onStartMock,
  onTab,
}: {
  onStartQuick?: () => void
  onStartMock?: () => void
  onTab?: (key: string) => void
}) {
  const [qCount, setQCount] = useState(10)

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={styles.eyebrow}>Sharpen your edge</Text>
          <Text style={styles.title}>Practice Mode</Text>
        </View>

        {/* Quick start cards */}
        <View style={styles.quickGrid}>
          {QUICK_CARDS.map((c, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.95 : 1 }]}
              onPress={i === 0 ? onStartQuick : i === 2 ? onStartMock : undefined}
            >
              <View style={{ width: 44, height: 44, borderRadius: 16, overflow: 'hidden' }}>
                <LinearGradient colors={c.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                </LinearGradient>
              </View>
              <Text style={styles.quickTitle}>{c.title}</Text>
              <Text style={styles.quickDesc}>{c.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Featured mock */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={styles.mockCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.mockIcon}><Text style={{ fontSize: 24 }}>🎤</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.mockBadge}><Text style={styles.mockBadgeText}>FULL MOCK</Text></View>
                <Text style={styles.mockTitle}>Senior SWE Mock Interview</Text>
                <Text style={styles.mockSub}>45 min · 3 rounds · AI-scored</Text>
              </View>
            </View>
            <Pressable onPress={onStartMock} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <View style={styles.mockCta}>
                <Zap size={14} color={colors.blue} fill={colors.blue} />
                <Text style={styles.mockCtaText}>Start mock interview</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Session settings */}
        <SectionTitle title="Session settings" />
        <View style={[styles.card, { gap: 12 }]}>
          <SettingRow icon={<Target size={18} color="#fff" />} tint={[colors.blue, colors.teal]} label="Questions" value={String(qCount)} />
          <SettingRow icon={<Clock size={18} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Time per question" value="90s" />
          <SettingRow icon={<Award size={18} color="#fff" />} tint={[colors.gold, colors.amber]} label="Difficulty" value="Adaptive" />
        </View>

        {/* Question count selector */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={styles.fieldLabel}>Number of questions</Text>
          <View style={styles.countRow}>
            {[5, 10, 15, 20].map((n) => (
              <Pressable
                key={n}
                onPress={() => setQCount(n)}
                style={({ pressed }) => [
                  styles.countBtn,
                  qCount === n && { overflow: 'hidden', ...shadows.soft },
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                {qCount === n && (
                  <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                )}
                <Text style={[styles.countText, qCount === n && styles.countTextActive]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Start button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Pressable onPress={onStartQuick} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Text style={styles.ctaText}>Start quick practice</Text>
              <ChevronRight size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
      <BottomNav active="practice" onTab={onTab} />
    </View>
  )
}

function SettingRow({ icon, tint, label, value }: { icon: React.ReactNode; tint: string[]; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      </View>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted }}>{value}</Text>
      <ChevronRight size={16} color="#cdd2d9" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  eyebrow: { fontSize: 11, fontWeight: '500', color: colors.textSubtle },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  quickCard: { width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 20, padding: 12, ...shadows.card },
  quickTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 8 },
  quickDesc: { fontSize: 10, color: colors.textSubtle },
  mockCard: { backgroundColor: '#1a1d24', borderRadius: 24, padding: 16, ...shadows.float },
  mockIcon: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden' },
  mockBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, marginBottom: 4 },
  mockBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  mockTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  mockSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  mockCta: { marginTop: 14, backgroundColor: '#fff', borderRadius: 16, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mockCtaText: { fontSize: 13, fontWeight: '800', color: colors.blue },
  card: { marginHorizontal: 16, marginTop: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadows.card },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  countRow: { flexDirection: 'row', gap: 8 },
  countBtn: { flex: 1, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  countText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  countTextActive: { color: '#fff' },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
