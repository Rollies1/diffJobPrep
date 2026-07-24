import React from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Plus, ChevronLeft, ChevronRight, Flame, Clock, CheckCircle2, Circle, Target, Bot, Calendar as CalIcon } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, GradientButton, ProgressRing } from '../components/primitives'
import { useStats, useActivity } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const INTENSITY_COLORS = ['#f0f2f5', '#dbeafe', '#18b6c5', '#f2c94c', '#fb7b3a']

type Day = { day: number | null; intensity: number; today?: boolean; planned?: boolean }

// March 2026 layout (Mar 1 = Sunday)
const CALENDAR: Day[][] = [
  [null, null, null, null, null, null, { day: 1, intensity: 2 }],
  [{ day: 2, intensity: 3 }, { day: 3, intensity: 2 }, { day: 4, intensity: 4 }, { day: 5, intensity: 1 }, { day: 6, intensity: 3 }, { day: 7, intensity: 2 }, { day: 8, intensity: 4 }],
  [{ day: 9, intensity: 3 }, { day: 10, intensity: 2 }, { day: 11, intensity: 4 }, { day: 12, intensity: 1 }, { day: 13, intensity: 3 }, { day: 14, intensity: 2 }, { day: 15, intensity: 4 }],
  [{ day: 16, intensity: 3 }, { day: 17, intensity: 2 }, { day: 18, intensity: 0, today: true, planned: true }, { day: 19, intensity: 0, planned: true }, { day: 20, intensity: 0, planned: true }, { day: 21, intensity: 0 }, { day: 22, intensity: 0 }],
  [{ day: 23, intensity: 0 }, { day: 24, intensity: 0 }, { day: 25, intensity: 0 }, { day: 26, intensity: 0 }, { day: 27, intensity: 0 }, { day: 28, intensity: 0 }, { day: 29, intensity: 0 }],
  [{ day: 30, intensity: 0 }, { day: 31, intensity: 0 }, null, null, null, null, null],
].map(week => week.map(d => d ?? { day: null, intensity: 0 }))

const TODAY_PLAN = [
  { time: '9:00 AM', title: 'Two Pointers — 5 questions', deck: 'Algorithms', done: true, emoji: '🎯', tint: [colors.blue, colors.teal] as any },
  { time: '1:30 PM', title: 'System Design: Caching', deck: 'System Design', done: true, emoji: '🏗️', tint: [colors.gold, colors.amber] as any },
  { time: '6:00 PM', title: 'Behavioral: Leadership', deck: 'Behavioral', done: false, emoji: '🧭', tint: [colors.teal, colors.tealGreen] as any },
  { time: '8:00 PM', title: 'Quick warmup — 3 questions', deck: 'Mixed', done: false, emoji: '⚡', tint: [colors.amber, colors.orange] as any },
]

export default function StudyPlanScreen({ onTab }: { onTab?: (key: string) => void }) {
  const { data: stats } = useStats()
  const { data: activity } = useActivity(7)

  const streak = stats?.streakDays ?? 13
  const doneCount = TODAY_PLAN.filter((p) => p.done).length
  const weeklyGoal = 25
  const weeklyDone = activity?.reduce((s: any, a: any) => s + a.sessionsCompleted, 0) ?? 22
  const weeklyPct = Math.round((weeklyDone / weeklyGoal) * 100)

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <JWordmark size={22} tone="dark" />
          <Pressable style={styles.fab}><Plus size={18} color="#fff" /></Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={styles.title}>Study plan</Text>
          <Text style={styles.sub}>Stay on track to your dream offer</Text>
        </View>

        {/* Streak + progress hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={styles.heroCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <ProgressRing progress={Math.round((doneCount / TODAY_PLAN.length) * 100)} size={68} stroke={7} trackColor="rgba(255,255,255,0.25)">
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.heroPct}>{doneCount}/{TODAY_PLAN.length}</Text>
                  <Text style={styles.heroPctLabel}>done</Text>
                </View>
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Flame size={16} color="#fff" />
                  <Text style={styles.streakText}>{streak}-day streak</Text>
                </View>
                <Text style={styles.heroSub}>{doneCount} of {TODAY_PLAN.length} sessions done today</Text>
                <Text style={styles.heroGoal}>You're {weeklyPct}% to your weekly goal!</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.card}>
          <View style={styles.calHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CalIcon size={16} color={colors.blue} />
              <Text style={styles.cardTitle}>March 2026</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Pressable style={styles.calNavBtn}><ChevronLeft size={16} color={colors.textMuted} /></Pressable>
              <Pressable style={styles.calNavBtn}><ChevronRight size={16} color={colors.textMuted} /></Pressable>
            </View>
          </View>

          <View style={styles.calWeekdays}>
            {WEEKDAYS.map((d, i) => <Text key={i} style={styles.weekdayText}>{d}</Text>)}
          </View>

          {CALENDAR.map((week, wi) => (
            <View key={wi} style={styles.calWeek}>
              {week.map((cell, ci) => (
                <View key={ci} style={styles.calCell}>
                  {cell.day !== null && (
                    <>
                      {cell.intensity > 0 && (
                        <View style={[styles.calDayBg, { backgroundColor: INTENSITY_COLORS[cell.intensity] }]} />
                      )}
                      <Text style={[
                        styles.calDayText,
                        cell.today && styles.calDayToday,
                        cell.intensity > 0 && !cell.today && { color: '#fff' },
                      ]}>{cell.day}</Text>
                      {cell.planned && !cell.today && <View style={styles.calPlannedDot} />}
                      {cell.today && <View style={styles.calTodayDot} />}
                    </>
                  )}
                </View>
              ))}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.legendText}>Less</Text>
              {INTENSITY_COLORS.map((c, i) => <View key={i} style={[styles.legendSwatch, { backgroundColor: c }]} />)}
              <Text style={styles.legendText}>More</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.calPlannedDot} />
              <Text style={styles.legendText}>Planned</Text>
            </View>
          </View>
        </View>

        {/* Today's plan */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>Today's plan</Text>
            <Text style={styles.sectionSub}>{doneCount}/{TODAY_PLAN.length} done</Text>
          </View>
          <View style={{ gap: 8, marginTop: 10 }}>
            {TODAY_PLAN.map((p, i) => (
              <View key={i} style={[styles.planRow, p.done && { opacity: 0.7 }]}>
                <View style={{ width: 36, height: 36, borderRadius: 12, overflow: 'hidden' }}>
                  <LinearGradient colors={p.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {p.done ? <CheckCircle2 size={14} color={colors.success} /> : <Circle size={14} color="#cdd2d9" />}
                    <Text style={[styles.planTitle, p.done && { textDecorationLine: 'line-through', color: colors.textSubtle }]} numberOfLines={1}>{p.title}</Text>
                  </View>
                  <Text style={styles.planMeta}>{p.time} · {p.deck}</Text>
                </View>
                {!p.done && <Pressable style={styles.startBtn}><Text style={styles.startBtnText}>Start</Text></Pressable>}
              </View>
            ))}
          </View>
        </View>

        {/* Weekly goal */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={styles.goalCard}>
            <View style={styles.goalIcon}>
              <LinearGradient colors={gradients.warm as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="#fff" />
              </LinearGradient>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalTitle}>Weekly goal · {weeklyGoal} sessions</Text>
              <Text style={styles.goalSub}>{weeklyDone} done · {weeklyGoal - weeklyDone} to go</Text>
            </View>
            <Text style={styles.goalPct}>{weeklyPct}%</Text>
          </View>
          <View style={styles.goalTrack}>
            <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, borderRadius: 4, width: `${weeklyPct}%` }} />
          </View>
        </View>

        {/* AI suggestion */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <LinearGradient colors={gradients.blueTeal as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Bot size={16} color="#fff" />
                <Text style={styles.aiHeaderText}>AI study suggestion</Text>
              </LinearGradient>
            </View>
            <Text style={styles.aiBody}>
              Based on your week, you're strong in Algorithms but light on System Design. I've added a{' '}
              <Text style={styles.aiHighlight}>Caching 101 session</Text> for Thursday at 6 PM.{' '}
              <Text style={styles.aiLink}>Adjust →</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      <BottomNav active="home" onTab={onTab} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  fab: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, overflow: 'hidden', ...shadows.soft },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 11, fontWeight: '500', color: colors.textSubtle },
  heroCard: { borderRadius: 24, padding: 16, overflow: 'hidden', ...shadows.float, backgroundColor: '#1a1d24' },
  heroPct: { fontSize: 16, fontWeight: '800', color: '#fff', lineHeight: 16 },
  heroPctLabel: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  streakText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroGoal: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  card: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadows.card },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  calNavBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center' },
  calWeekdays: { flexDirection: 'row', marginTop: 12 },
  weekdayText: { flex: 1, textAlign: 'center', fontSize: 9, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase' },
  calWeek: { flexDirection: 'row', marginTop: 6 },
  calCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDayBg: { position: 'absolute', width: 28, height: 28, borderRadius: 8 },
  calDayText: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted },
  calDayToday: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1a1d24', color: '#fff', textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden' },
  calPlannedDot: { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.blue },
  calTodayDot: { position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: 2, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  legendText: { fontSize: 9, fontWeight: '600', color: colors.textSubtle },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sectionSub: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  planTitle: { flex: 1, fontSize: 12.5, fontWeight: '700', color: colors.ink },
  planMeta: { fontSize: 9.5, color: colors.textSubtle, marginLeft: 20, marginTop: 2 },
  startBtn: { borderRadius: 999, overflow: 'hidden', backgroundColor: colors.blue },
  startBtnText: { fontSize: 10, fontWeight: '700', color: '#fff', paddingHorizontal: 10, paddingVertical: 6 },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1d24', borderRadius: 16, padding: 14 },
  goalIcon: { width: 36, height: 36, borderRadius: 12, overflow: 'hidden' },
  goalTitle: { fontSize: 12.5, fontWeight: '700', color: '#fff' },
  goalSub: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
  goalPct: { fontSize: 14, fontWeight: '800', color: colors.gold },
  goalTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  aiCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', ...shadows.card },
  aiHeader: { overflow: 'hidden', borderRadius: 8 },
  aiHeaderText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  aiBody: { fontSize: 12, lineHeight: 18, color: '#3b424c', padding: 14 },
  aiHighlight: { fontWeight: '700', color: colors.blue },
  aiLink: { fontWeight: '700', color: colors.blue },
})
