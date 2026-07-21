import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Trophy, Mic, Play, Pause, Download, Share2, CheckCircle2, AlertTriangle, ChevronRight, Clock, Star, TrendingUp, RotateCcw, Home, Sparkles, ThumbsUp } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { ProgressRing, GradientButton } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

const ROUNDS = [
  { n: 1, name: 'Behavioral', type: 'Leadership & culture fit', score: 88, duration: '12:30', emoji: '🧭', tint: [colors.teal, colors.tealGreen] as string[], note: 'Strong STAR stories, great energy.' },
  { n: 2, name: 'Coding', type: 'Algorithms & data structures', score: 79, duration: '18:45', emoji: '💻', tint: [colors.blue, colors.teal] as string[], note: 'Solved both, 1 suboptimal approach.' },
  { n: 3, name: 'System Design', type: 'Scalability & architecture', score: 71, duration: '21:10', emoji: '🏗️', tint: [colors.gold, colors.amber] as string[], note: 'Solid basics, missed throughput calc.' },
]

const WAVEFORM = Array.from({ length: 48 }).map((_, i) => {
  const base = Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.31))
  const env = 0.35 + 0.65 * Math.sin((i / 48) * Math.PI)
  return Math.max(4, Math.round(base * env * 24))
})

export default function MockInterviewResultsScreen({ onHome }: { onHome?: () => void }) {
  const [score, setScore] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(34)
  const target = 79

  useEffect(() => {
    const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const dur = 1200
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - startMs) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setScore(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Brand bar */}
        <View style={styles.brandBar}>
          <JWordmark size={22} tone="dark" />
          <View style={styles.completeBadge}><CheckCircle2 size={12} color={colors.success} strokeWidth={3} /><Text style={styles.completeText}>MOCK COMPLETE</Text></View>
        </View>

        {/* Hero score */}
        <View style={styles.heroWrap}>
          <View style={styles.ringGlow} />
          <ProgressRing progress={score} size={136} stroke={10} trackColor="rgba(46,139,238,0.12)">
            <View style={{ alignItems: 'center' }}>
              <Trophy size={24} color={colors.amber} />
              <Text style={styles.scoreText}>{score}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </ProgressRing>
          <Text style={styles.title}>Mock interview report</Text>
          <Text style={styles.sub}>Senior SWE · 3 rounds · 52 min · <Text style={styles.passed}>Passed</Text></Text>
          <View style={styles.verdictPill}><TrendingUp size={14} color={colors.success} /><Text style={styles.verdictText}>Above bar for Senior · +6% vs last mock</Text></View>
        </View>

        {/* Round breakdown */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>Round breakdown</Text>
            <Text style={styles.sectionSub}>3 rounds</Text>
          </View>
          <View style={{ gap: 10, marginTop: 10 }}>
            {ROUNDS.map((r) => (
              <View key={r.n} style={styles.roundRow}>
                <View style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden' }}>
                  <LinearGradient colors={r.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.roundName} numberOfLines={1}>R{r.n} · {r.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}><Clock size={12} color={colors.textSubtle} /><Text style={styles.roundTime}>{r.duration}</Text></View>
                  </View>
                  <Text style={styles.roundType}>{r.type}</Text>
                  <Text style={styles.roundNote}>{r.note}</Text>
                </View>
                <ProgressRing progress={r.score} size={40} stroke={4} trackColor="rgba(154,161,171,0.18)">
                  <Text style={styles.roundScore}>{r.score}</Text>
                </ProgressRing>
                <ChevronRight size={16} color="#cdd2d9" />
              </View>
            ))}
          </View>
        </View>

        {/* Recording */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={styles.recCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Mic size={16} color={colors.gold} />
              <Text style={styles.recTitle}>Full recording</Text>
              <Text style={styles.recDuration}>52:25</Text>
            </View>
            {/* Waveform */}
            <View style={styles.waveform}>
              {WAVEFORM.map((h, i) => {
                const active = i / WAVEFORM.length <= progress / 100
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: h,
                      borderRadius: 2,
                      backgroundColor: active ? undefined : 'rgba(255,255,255,0.18)',
                      overflow: 'hidden',
                    }}
                  >
                    {active && <LinearGradient colors={[colors.blue, colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }} />}
                  </View>
                )
              })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <Pressable onPress={() => setPlaying((p) => !p)} style={styles.playBtn}>
                <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  {playing ? <Pause size={16} color="#fff" fill="#fff" /> : <Play size={16} color="#fff" fill="#fff" />}
                </LinearGradient>
              </Pressable>
              <Text style={styles.recTime}>{Math.round(progress * 0.5225)}:17 / 52:25</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
                <Pressable style={styles.recIconBtn}><Download size={14} color="#fff" /></Pressable>
                <Pressable style={styles.recIconBtn}><Share2 size={14} color="#fff" /></Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* AI assessment */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <LinearGradient colors={gradients.blueTeal as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Sparkles size={16} color="#fff" />
                <Text style={styles.aiHeaderText}>AI assessment</Text>
              </LinearGradient>
            </View>
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><ThumbsUp size={14} color={colors.success} /><Text style={styles.strengthLabel}>Strengths</Text></View>
              {['Clear, structured communication — easy to follow your reasoning.', 'Strong behavioral storytelling using the STAR framework.', 'Great edge-case awareness in the coding round.'].map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <CheckCircle2 size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.evalItem}>{s}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}><AlertTriangle size={14} color={colors.warning} /><Text style={styles.weakLabel}>Areas to improve</Text></View>
              {['Quantify system design — mention throughput, latency, QPS numbers.', 'Optimize the 2nd coding solution; push for the optimal.', 'Slow down when nervous — pace dropped in the last 5 minutes.'].map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning, marginTop: 6 }} />
                  <Text style={styles.evalItem}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Skill snapshot */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
              <Star size={16} color={colors.gold} />
              <Text style={styles.cardTitle}>Skill snapshot</Text>
            </View>
            <View style={{ gap: 8, marginTop: 10 }}>
              {[
                { name: 'Communication', value: 92, tint: [colors.teal, colors.tealGreen] as string[] },
                { name: 'Problem solving', value: 81, tint: [colors.blue, colors.teal] as string[] },
                { name: 'Technical depth', value: 74, tint: [colors.gold, colors.amber] as string[] },
                { name: 'Composure', value: 68, tint: [colors.amber, colors.orange] as string[] },
              ].map((s) => (
                <View key={s.name}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.skillName}>{s.name}</Text>
                    <Text style={styles.skillValue}>{s.value}</Text>
                  </View>
                  <View style={styles.skillTrack}>
                    <LinearGradient colors={s.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, borderRadius: 4, width: `${s.value}%` }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable style={styles.homeBtn} onPress={onHome}>
            <Home size={16} color={colors.textMuted} />
            <Text style={styles.homeText}>Home</Text>
          </Pressable>
          <Pressable style={{ flex: 1 }}>
            <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <RotateCcw size={16} color="#fff" />
              <Text style={styles.ctaText}>New mock interview</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  brandBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  completeBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  completeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  heroWrap: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 },
  ringGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: colors.blue, opacity: 0.1, top: 4 },
  scoreText: { fontSize: 34, fontWeight: '800', color: colors.blue, lineHeight: 34 },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: colors.textSubtle },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 12, letterSpacing: -0.3 },
  sub: { fontSize: 12.5, fontWeight: '500', color: colors.textMuted, marginTop: 4 },
  passed: { fontWeight: '700', color: colors.success },
  verdictPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
  verdictText: { fontSize: 11, fontWeight: '700', color: colors.success },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sectionSub: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  roundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  roundName: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink },
  roundTime: { fontSize: 10, fontWeight: '500', color: colors.textSubtle },
  roundType: { fontSize: 10.5, color: colors.textSubtle, marginTop: 2 },
  roundNote: { fontSize: 10.5, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  roundScore: { fontSize: 11, fontWeight: '800', color: colors.ink },
  recCard: { backgroundColor: '#1a1d24', borderRadius: 16, padding: 14, ...shadows.float },
  recTitle: { fontSize: 12, fontWeight: '700', color: '#fff' },
  recDuration: { marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 12, height: 30 },
  playBtn: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  recTime: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  recIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  aiCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', ...shadows.card },
  aiHeader: { overflow: 'hidden', borderRadius: 8 },
  aiHeaderText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  strengthLabel: { fontSize: 11, fontWeight: '700', color: colors.success, textTransform: 'uppercase', letterSpacing: 0.5 },
  weakLabel: { fontSize: 11, fontWeight: '700', color: colors.warning, textTransform: 'uppercase', letterSpacing: 0.5 },
  evalItem: { flex: 1, fontSize: 11.5, color: '#3b424c', lineHeight: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadows.card },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  skillName: { fontSize: 11, fontWeight: '600', color: colors.ink },
  skillValue: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  skillTrack: { height: 8, backgroundColor: '#eef2f7', borderRadius: 4, overflow: 'hidden' },
  homeBtn: { height: 48, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadows.card },
  homeText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  cta: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
