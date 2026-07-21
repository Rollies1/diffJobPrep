import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Trophy, Zap, TrendingUp, Check, X, ChevronRight, RotateCcw, Home, Star } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { ProgressRing, GradientButton } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'
import type { SessionResult } from '../types/api'

export default function CompletionCelebrationScreen({
  result,
  deckTitle,
  onPracticeAgain,
  onHome,
}: {
  result: SessionResult
  deckTitle?: string
  onPracticeAgain?: () => void
  onHome?: () => void
}) {
  const [score, setScore] = useState(0)
  const [shared, setShared] = useState(false)
  const target = result.score

  // Animate score counter.
  useEffect(() => {
    const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const dur = 1100
    let raf = 0
    const tick = (now?: number) => {
      const current = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const p = Math.min(1, (current - startMs) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setScore(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  const correct = result.correctAnswers
  const total = result.totalQuestions
  const xpEarned = correct * 15 + (target >= 90 ? 30 : 0)

  const skills = Object.entries(result.skillBreakdown ?? {})

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Brand bar */}
        <View style={styles.brandBar}>
          <JWordmark size={22} tone="dark" />
          <View style={styles.completeBadge}><Check size={12} color={colors.success} strokeWidth={3} /><Text style={styles.completeText}>COMPLETED</Text></View>
        </View>

        {/* Hero: score reveal */}
        <View style={styles.heroWrap}>
          <View style={styles.ringGlow} />
          <ProgressRing progress={score} size={132} stroke={10} trackColor="rgba(46,139,238,0.12)">
            <View style={{ alignItems: 'center' }}>
              <Trophy size={24} color={colors.amber} />
              <Text style={styles.scoreText}>{score}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </ProgressRing>
          <Text style={styles.greeting}>Great job! 🎉</Text>
          <Text style={styles.greetingSub}>
            You finished {deckTitle ?? 'the session'} · {correct} of {total} correct
          </Text>
        </View>

        {/* Stat deltas */}
        <View style={styles.statRow}>
          <StatDelta icon={<Zap size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="XP earned" value={`+${xpEarned}`} />
          <StatDelta icon={<Star size={16} color="#fff" />} tint={[colors.amber, colors.orange]} label="Correct" value={`${correct}/${total}`} />
          <StatDelta icon={<TrendingUp size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Score" value={`${score}%`} />
        </View>

        {/* Skill breakdown */}
        {skills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skill breakdown</Text>
            {skills.map(([name, value]) => (
              <View key={name} style={{ marginTop: 10 }}>
                <View style={styles.skillRow}>
                  <Text style={styles.skillName}>{name}</Text>
                  <Text style={styles.skillValue}>{value}</Text>
                </View>
                <View style={styles.skillTrack}>
                  <LinearGradient colors={[colors.blue, colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, borderRadius: 4, width: `${Math.min(100, value as number)}%` }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Share card */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={styles.shareCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.shareIcon}><Trophy size={20} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareLabel}>I scored</Text>
                <Text style={styles.shareScore}>{score}/100</Text>
                <Text style={styles.shareSub}>{deckTitle ?? 'JobPrep'} · JobPrep</Text>
              </View>
              <JWordmark size={18} tone="light" />
            </View>
            <Pressable onPress={() => setShared(true)} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <View style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>{shared ? 'Copied to clipboard!' : 'Share my score'}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <Pressable style={styles.homeBtn} onPress={onHome}>
            <Home size={16} color={colors.textMuted} />
            <Text style={styles.homeText}>Home</Text>
          </Pressable>
          <Pressable onPress={onPracticeAgain} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <RotateCcw size={16} color="#fff" />
              <Text style={styles.ctaText}>Practice again</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

function StatDelta({ icon, tint, label, value }: { icon: React.ReactNode; tint: string[]; label: string; value: string }) {
  return (
    <View style={styles.deltaCard}>
      <View style={{ width: 32, height: 32, borderRadius: 12, overflow: 'hidden', alignSelf: 'center' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      </View>
      <Text style={styles.deltaValue}>{value}</Text>
      <Text style={styles.deltaLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  brandBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  completeBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  completeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  heroWrap: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  ringGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: colors.blue, opacity: 0.1, top: 8 },
  scoreText: { fontSize: 34, fontWeight: '800', color: colors.blue, lineHeight: 34 },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: colors.textSubtle },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 16, letterSpacing: -0.3 },
  greetingSub: { fontSize: 12.5, fontWeight: '500', color: colors.textMuted, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  deltaCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 10, alignItems: 'center', ...shadows.card },
  deltaValue: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 8 },
  deltaLabel: { fontSize: 9.5, fontWeight: '600', color: colors.textSubtle, textTransform: 'uppercase', marginTop: 2 },
  card: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadows.card },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  skillName: { fontSize: 12, fontWeight: '600', color: colors.ink },
  skillValue: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  skillTrack: { height: 8, backgroundColor: '#eef2f7', borderRadius: 4, overflow: 'hidden' },
  shareCard: { backgroundColor: '#1a1d24', borderRadius: 24, padding: 16, ...shadows.float },
  shareIcon: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  shareLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  shareScore: { fontSize: 22, fontWeight: '800', color: '#fff' },
  shareSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  shareBtn: { marginTop: 12, backgroundColor: '#fff', borderRadius: 16, height: 44, alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { fontSize: 13, fontWeight: '800', color: colors.blue },
  bottomActions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  homeBtn: { height: 48, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadows.card },
  homeText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  cta: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
