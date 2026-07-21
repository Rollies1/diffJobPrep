import React from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Bell, Flame, Target, Trophy, Play, ChevronRight, Clock, Zap } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import {
  BreathingGradient,
  Avatar,
  StreakFlame,
  StatTile,
  ProgressRing,
  SectionTitle,
  MiniBarChart,
  GradientButton,
} from '../components/primitives'
import { useStats, useActivity, useHistory } from '../hooks/queries'
import { useAuthStore } from '../store/useAuthStore'
import { colors, gradients, shadows } from '../theme'
import { StatTileGridSkeleton, ChartSkeleton } from '../components/Skeleton'
import { dashboardStyles as styles } from '../components/styles'

const SKILL_TINTS = [
  [colors.blue, colors.teal],
  [colors.teal, colors.tealGreen],
  [colors.gold, colors.amber],
  [colors.amber, colors.orange],
]

const MOCK_SKILLS = [
  { name: 'Technical', value: 82 },
  { name: 'Behavioral', value: 91 },
  { name: 'System Design', value: 58 },
  { name: 'Communication', value: 74 },
]

/** Time-of-day greeting with matching emoji. */
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning', emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' }
  if (h < 21) return { text: 'Good evening', emoji: '🌆' }
  return { text: 'Good night', emoji: '🌙' }
}

export default function DashboardScreen({ onTab }: { onTab?: (key: string) => void }) {
  const user = useAuthStore((s) => s.user)
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: activity } = useActivity(7)
  const { data: history } = useHistory(5)

  // Real user name — fall back to email-local-part if name is missing.
  const displayName = user?.name || user?.username || (user?.email ? user.email.split('@')[0] : 'there')
  const avatarName = user?.username || user?.name || displayName

  const streak = stats?.streakDays ?? 0
  const answered = stats?.totalAnswered ?? 0
  // Accuracy: use completionRate from backend if present, else 0 (not a mock 84%).
  const accuracy = stats?.completionRate ? Math.round(stats.completionRate) : 0
  const rank = stats?.rankName ?? 'Apprentice'

  // Map activity to chart data; fall back to zeros (not mock) when no data.
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const chartData =
    activity && activity.length > 0
      ? activity.map((a: any, i: number) => ({ label: weekDays[i] ?? '?', value: a.questionsAnswered, highlight: a.questionsAnswered > 0 }))
      : weekDays.map((d) => ({ label: d, value: 0, highlight: false }))

  const skills =
    stats?.skillBreakdown && Object.keys(stats.skillBreakdown).length >= 2
      ? Object.entries(stats.skillBreakdown).map(([name, value]) => ({ name, value }))
      : MOCK_SKILLS

  // Recent sessions — only show real data.
  const recentSessions =
    history?.pages?.[0]?.data && history.pages[0].data.length > 0
      ? history.pages[0].data.slice(0, 3)
      : []

  // Resume card: only show if the user has an in-progress session (history
  // returns completed sessions, so we check for any session at all). On first
  // use there's nothing to resume.
  const hasInProgress = recentSessions.length > 0
  const lastSession = recentSessions[0]
  const resumeProgress = hasInProgress && lastSession
    ? Math.round((lastSession.answeredQuestions / Math.max(lastSession.totalQuestions, 1)) * 100)
    : 0

  const greet = greeting()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Brand bar */}
        <View style={styles.brandBar}>
          <JWordmark size={24} tone="dark" />
          <Pressable style={styles.bellBtn}>
            <Bell size={18} color={colors.ink} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        {/* Greeting */}
        <View style={styles.greetingRow}>
          <Avatar name={avatarName} size={42} ring />
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingLabel}>{greet.text} {greet.emoji}</Text>
            <Text style={styles.greetingName} numberOfLines={1}>{displayName}</Text>
          </View>
          <StreakFlame days={streak} />
        </View>

        {/* Resume card OR first-time CTA */}
        <View style={{ paddingHorizontal: 16 }}>
          {hasInProgress ? (
            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
              <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resumeCard}>
                <ProgressRing progress={resumeProgress} size={72} stroke={7} trackColor="rgba(255,255,255,0.25)">
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.resumePct}>{resumeProgress}%</Text>
                    <Text style={styles.resumePctLabel}>done</Text>
                  </View>
                </ProgressRing>
                <View style={{ flex: 1 }}>
                  <View style={styles.resumeBadge}>
                    <Text style={styles.resumeBadgeText}>RESUME SESSION</Text>
                  </View>
                  <Text style={styles.resumeTitle} numberOfLines={1}>{lastSession.deckName ?? 'Practice session'}</Text>
                  <Text style={styles.resumeSub}>{lastSession.answeredQuestions} of {lastSession.totalQuestions} questions</Text>
                </View>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable onPress={() => onTab?.('practice')} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
              <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resumeCard}>
                <View style={styles.resumeBadge}>
                  <Text style={styles.resumeBadgeText}>GET STARTED</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resumeTitle} numberOfLines={1}>Start your first session</Text>
                  <Text style={styles.resumeSub}>Jump in — pick a deck and practice</Text>
                </View>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        {statsLoading ? (
          <StatTileGridSkeleton />
        ) : (
          <View style={styles.statsGrid}>
            <StatTile label="Day streak" value={String(streak)} sub={streak > 0 ? 'Keep it up!' : 'Start today'} accent="orange" icon={<Flame size={14} color="#fff" />} />
            <StatTile label="Answered" value={String(answered)} sub={answered > 0 ? 'Great work' : 'No answers yet'} accent="blue" icon={<Target size={14} color="#fff" />} />
            <StatTile label="Accuracy" value={`${accuracy}%`} sub={accuracy > 0 ? '↑ keep going' : '—'} accent="teal" icon={<Zap size={14} color="#fff" />} />
            <StatTile label="Rank" value={rank} sub={answered > 0 ? 'Top 8%' : 'Climb up'} accent="gold" icon={<Trophy size={14} color="#fff" />} />
          </View>
        )}

        {/* Weekly activity */}
        <SectionTitle title="Weekly activity" action={<Text style={styles.link}>Details</Text>} />
        <View style={[styles.card, { marginTop: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <Text style={styles.bigNumber}>{chartData.reduce((a: any, b: any) => a + b.value, 0)}</Text>
            <Text style={styles.cardSubtext}>sessions this week</Text>
          </View>
          {statsLoading ? (
            <ChartSkeleton />
          ) : (
            <MiniBarChart data={chartData} />
          )}
        </View>

        {/* Skill breakdown */}
        <SectionTitle title="Skill breakdown" />
        <View style={[styles.card, { gap: 10, marginTop: 10 }]}>
          {skills.map((s, i) => (
            <View key={s.name}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.skillName}>{s.name}</Text>
                <Text style={styles.skillValue}>{String(s.value)}%</Text>
              </View>
              <View style={styles.skillTrack}>
                <LinearGradient
                  colors={SKILL_TINTS[i % SKILL_TINTS.length] as readonly string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 8, borderRadius: 4, width: `${s.value}%` as any }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Recent sessions */}
        <SectionTitle title="Recent sessions" action={<Text style={styles.link}>See all</Text>} />
        <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 10 }}>
          {recentSessions.map((s: any, i: number) => (
            <Pressable key={s.sessionId} style={({ pressed }) => [styles.card, { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.95 : 1 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
                <LinearGradient colors={SKILL_TINTS[i % SKILL_TINTS.length] as readonly string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>🎯</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle} numberOfLines={1}>{s.deckName ?? 'Practice session'}</Text>
                <Text style={styles.sessionMeta}>{s.answeredQuestions}/{s.totalQuestions} correct · {Math.round(s.durationMs / 1000)}s</Text>
              </View>
              <Text style={styles.sessionScore}>{String(s.score)}%</Text>
              <ChevronRight size={16} color={colors.textSubtle} />
            </Pressable>
          ))}
          {recentSessions.length === 0 && (
            <View style={[styles.card, { padding: 16, alignItems: 'center' }]}>
              <Text style={{ fontSize: 12, color: colors.textSubtle }}>No sessions yet — start your first practice!</Text>
            </View>
          )}
        </View>

        {/* Quick CTA — daily warmup with a properly sized Go button */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={styles.darkCard}>
            <View style={styles.darkCardIcon}>
              <Clock size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.darkCardTitle}>Daily 5-min warmup</Text>
              <Text style={styles.darkCardSub}>3 quick questions to stay sharp</Text>
            </View>
            <GradientButton size="md" variant="warm" onPress={() => onTab?.('practice')}>Go</GradientButton>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="home" onTab={onTab} />
    </View>
  )
}
