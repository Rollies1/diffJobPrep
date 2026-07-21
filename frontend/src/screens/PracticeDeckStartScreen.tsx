import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, Clock, Users, ChevronRight, Shuffle, Eye, Zap } from 'lucide-react-native'
import { ScreenHeader, DifficultyBadge, GradientButton } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'
import type { DeckDto } from '../types/api'

export default function PracticeDeckStartScreen({
  deck,
  onStart,
  onBack,
}: {
  deck: DeckDto
  onStart?: (config: { questionCount: number; shuffle: boolean; timed: boolean; feedback: boolean }) => void
  onBack?: () => void
}) {
  const [count, setCount] = useState(10)
  const [shuffle, setShuffle] = useState(true)
  const [timed, setTimed] = useState(true)
  const [feedback, setFeedback] = useState(true)

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={{ overflow: 'hidden', borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
        <LinearGradient colors={gradients.blueTeal as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <ScreenHeader title="" onBack={onBack} variant="transparent"
            right={<Pressable style={styles.iconBtn}><ChevronRight size={20} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} /></Pressable>}
          />
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.emojiTile}><Text style={{ fontSize: 28 }}>📚</Text></View>
              <View>
                <View style={styles.catBadge}><Text style={styles.catBadgeText}>{deck.category.toUpperCase()}</Text></View>
                <Text style={styles.bannerTitle}>{deck.title}</Text>
                <View style={styles.bannerMeta}>
                  <View style={styles.metaRow}><Users size={12} color="rgba(255,255,255,0.85)" /><Text style={styles.metaText}>{deck.questionCount} Qs</Text></View>
                  <View style={styles.metaRow}><Clock size={12} color="rgba(255,255,255,0.85)" /><Text style={styles.metaText}>~{Math.round(deck.questionCount * 1.5)} min</Text></View>
                  <DifficultyBadge level={deck.questionCount > 25 ? 'Hard' : deck.questionCount > 15 ? 'Medium' : 'Easy'} />
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Best score */}
        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>Your best score</Text>
            <Text style={styles.scoreValue}>87%</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.scoreLabel}>Last attempt</Text>
            <Text style={styles.scoreLast}>2 days ago · 7/8</Text>
          </View>
        </View>

        {/* Question count */}
        <Text style={styles.fieldLabel}>Number of questions</Text>
        <View style={styles.countRow}>
          {[5, 10, 15, deck.questionCount].map((n) => (
            <Pressable
              key={n}
              onPress={() => setCount(n)}
              style={({ pressed }) => [
                styles.countBtn,
                count === n && { overflow: 'hidden', ...shadows.soft },
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              {count === n && <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
              <Text style={[styles.countText, count === n && { color: '#fff' }]}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* Options */}
        <Text style={styles.fieldLabel}>Session options</Text>
        <View style={{ gap: 8, marginTop: 8 }}>
          <ToggleRow icon={<Shuffle size={18} color="#fff" />} tint={[colors.blue, colors.teal]} label="Shuffle questions" desc="Randomize the order each run" on={shuffle} onToggle={() => setShuffle((s) => !s)} />
          <ToggleRow icon={<Clock size={18} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Time each question" desc="90 seconds per question" on={timed} onToggle={() => setTimed((s) => !s)} />
          <ToggleRow icon={<Eye size={18} color="#fff" />} tint={[colors.gold, colors.amber]} label="Instant feedback" desc="Show correct answer right away" on={feedback} onToggle={() => setFeedback((s) => !s)} />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <LinearGradient colors={gradients.warm as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#fff" />
            </LinearGradient>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Ready when you are</Text>
            <Text style={styles.summarySub}>{count} questions · ~{Math.round(count * 1.2)} min</Text>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.stickyCta}>
        <Pressable onPress={() => onStart?.({ questionCount: count, shuffle, timed, feedback })} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>Start practice ({count} Qs)</Text>
            <ChevronRight size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

function ToggleRow({ icon, tint, label, desc, on, onToggle }: {
  icon: React.ReactNode; tint: string[]; label: string; desc: string; on: boolean; onToggle: () => void
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ width: 36, height: 36, borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Pressable onPress={onToggle} style={{ width: 44, height: 24, borderRadius: 12, overflow: 'hidden', justifyContent: 'center' }}>
        {on && <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
        {!on && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e3e7ee' }]} />}
        <View style={[styles.toggleKnob, on ? { right: 2 } : { left: 2 }]} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: {},
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  emojiTile: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  catBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, marginBottom: 4 },
  catBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  bannerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  scoreCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginTop: 16, ...shadows.card },
  scoreLabel: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  scoreValue: { fontSize: 20, fontWeight: '800', color: colors.blue, marginTop: 2 },
  scoreLast: { fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 2 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 20, marginBottom: 8 },
  countRow: { flexDirection: 'row', gap: 8 },
  countBtn: { flex: 1, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  countText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.ink },
  toggleDesc: { fontSize: 10, color: colors.textSubtle, marginTop: 2 },
  toggleKnob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', ...shadows.card },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1d24', borderRadius: 16, padding: 14, marginTop: 20 },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, overflow: 'hidden' },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  summarySub: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  stickyCta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16, backgroundColor: 'rgba(251,252,254,0.95)' },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
