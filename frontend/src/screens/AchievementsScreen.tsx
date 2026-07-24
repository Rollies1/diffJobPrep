import React from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Trophy, Flame, Zap, Medal, Lock, Check, ChevronRight } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, ProgressRing } from '../components/primitives'
import { useStats } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'

const STREAK_MILESTONES = [
  { days: 3, label: '3 days', emoji: '🔥', unlocked: true },
  { days: 7, label: '7 days', emoji: '⚡', unlocked: true },
  { days: 14, label: '14 days', emoji: '💎', unlocked: true },
  { days: 30, label: '30 days', emoji: '👑', unlocked: false, progress: 13 },
  { days: 60, label: '60 days', emoji: '🏆', unlocked: false, progress: 22 },
  { days: 100, label: '100 days', emoji: '🌟', unlocked: false, progress: 13 },
]

type Badge = { id: string; name: string; desc: string; emoji: string; tint: string[]; status: 'unlocked' | 'progress' | 'locked'; progress?: number; date?: string; rare?: boolean }

const BADGES: Badge[] = [
  { id: 'first', name: 'First Steps', desc: 'Complete your first session', emoji: '👶', tint: [colors.blue, colors.teal], status: 'unlocked', date: 'Mar 2' },
  { id: 'sharp', name: 'Sharp Shooter', desc: 'Score 90%+ on a deck', emoji: '🎯', tint: [colors.teal, colors.tealGreen], status: 'unlocked', date: 'Mar 8' },
  { id: 'century', name: 'Century Club', desc: 'Answer 100 questions', emoji: '💯', tint: [colors.tealGreen, colors.gold], status: 'unlocked', date: 'Mar 12' },
  { id: 'tutor', name: 'Inquisitive Mind', desc: 'Chat with the AI Tutor 50×', emoji: '🤖', tint: ['#8b5cf6', colors.blue], status: 'progress', progress: 72 },
  { id: 'scholar', name: 'Scholar', desc: 'Master 5 full decks', emoji: '📚', tint: [colors.gold, colors.amber], status: 'progress', progress: 60 },
  { id: 'night', name: 'Night Owl', desc: 'Practice after midnight 10×', emoji: '🦉', tint: ['#6366f1', '#8b5cf6'], status: 'progress', progress: 40 },
  { id: 'perfectionist', name: 'Perfectionist', desc: 'Ace a deck with 100%', emoji: '✨', tint: [colors.amber, colors.orange], status: 'locked' },
  { id: 'speed', name: 'Speed Demon', desc: 'Finish a deck in under 5 min', emoji: '⚡', tint: [colors.orange, '#f43f5e'], status: 'locked' },
  { id: 'master', name: 'Interview Master', desc: 'Complete a full mock interview', emoji: '🎤', tint: ['#8b5cf6', '#f43f5e'], status: 'locked' },
  { id: 'legend', name: 'Legend', desc: 'Reach a 100-day streak', emoji: '👑', tint: [colors.gold, colors.orange], status: 'locked', rare: true },
]

export default function AchievementsScreen({ onTab }: { onTab?: (key: string) => void }) {
  const { data: stats } = useStats()
  const unlocked = BADGES.filter((b) => b.status === 'unlocked').length
  const total = BADGES.length
  const pct = Math.round((unlocked / total) * 100)
  const streak = stats?.streakDays ?? 13
  const xp = stats?.totalXp ?? 1240
  const level = stats?.currentLevel ?? 8

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <JWordmark size={24} tone="dark" />
        </View>

        {/* Hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={styles.heroCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <ProgressRing progress={pct} size={76} stroke={7} trackColor="rgba(255,255,255,0.25)">
                <View style={{ alignItems: 'center' }}>
                  <Trophy size={16} color="#fff" />
                  <Text style={styles.heroCount}>{unlocked}/{total}</Text>
                </View>
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>ACHIEVEMENTS</Text></View>
                <Text style={styles.heroTitle}>Your trophy room</Text>
                <Text style={styles.heroSub}>{unlocked} of {total} badges unlocked · {total - unlocked} to go</Text>
              </View>
              <Text style={{ fontSize: 28 }}>🏆</Text>
            </View>
            <View style={styles.heroStatsRow}>
              <HeroStat icon={<Flame size={16} color="#fff" />} value={`${streak}d`} label="Streak" />
              <HeroStat icon={<Zap size={16} color="#fff" />} value={String(xp)} label="XP" />
              <HeroStat icon={<Medal size={16} color="#fff" />} value={`Lv ${level}`} label="Level" />
            </View>
          </View>
        </View>

        {/* Streak milestones */}
        <SectionLabel label="Streak milestones" emoji="🔥" />
        <ScrollView style={{ maxHeight: 130 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingTop: 10 }} horizontal showsHorizontalScrollIndicator={false}>
          {STREAK_MILESTONES.map((m) => {
            const p = m.unlocked ? 100 : (m.progress ?? 0)
            return (
              <View key={m.days} style={[styles.milestoneCard, !m.unlocked && { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                {m.unlocked ? (
                  <View style={styles.milestoneCheck}><LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}><Check size={10} color="#fff" strokeWidth={3.5} /></LinearGradient></View>
                ) : (
                  <View style={styles.milestoneLock}><Lock size={10} color={colors.textSubtle} /></View>
                )}
                <ProgressRing progress={p} size={52} stroke={5} trackColor={m.unlocked ? 'rgba(46,139,238,0.12)' : 'rgba(154,161,171,0.18)'}>
                  <Text style={[styles.milestoneEmoji, !m.unlocked && { opacity: 0.4 }]}>{m.emoji}</Text>
                </ProgressRing>
                <Text style={[styles.milestoneLabel, !m.unlocked && { color: colors.textSubtle }]}>{m.label}</Text>
                {!m.unlocked && <Text style={styles.milestoneProgress}>Day {m.progress}/100</Text>}
              </View>
            )
          })}
        </ScrollView>

        {/* Mastery badges grid */}
        <SectionLabel label="Mastery badges" emoji="🎖️" style={{ marginTop: 20 }} />
        <View style={styles.badgesGrid}>
          {BADGES.map((b, i) => <BadgeCard key={b.id} badge={b} index={i} />)}
        </View>

        {/* Recent unlocks */}
        <SectionLabel label="Recently unlocked" emoji="✨" style={{ marginTop: 20 }} />
        <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 8 }}>
          {BADGES.filter((b) => b.status === 'unlocked').slice(-3).reverse().map((b) => (
            <View key={b.id} style={styles.recentRow}>
              <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
                <LinearGradient colors={b.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{b.emoji}</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentName}>{b.name}</Text>
                <Text style={styles.recentDesc}>{b.desc}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.recentStatus}>Unlocked</Text>
                <Text style={styles.recentDate}>{b.date}</Text>
              </View>
              <ChevronRight size={16} color="#cdd2d9" />
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active="profile" onTab={onTab} />
    </View>
  )
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.heroStat}>
      {icon}
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  )
}

function SectionLabel({ label, emoji, style }: { label: string; emoji?: string; style?: object }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      {emoji && <Text style={{ fontSize: 14 }}>{emoji}</Text>}
      <Text style={styles.sectionLabelText}>{label}</Text>
      <View style={styles.sectionDivider} />
    </View>
  )
}

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  const locked = badge.status === 'locked'
  const progress = badge.status === 'progress' ? badge.progress ?? 0 : badge.status === 'unlocked' ? 100 : 0
  return (
    <View style={[styles.badgeCard, locked && { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
      {badge.rare && (
        <View style={styles.rareBadge}>
          <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.rareText}>RARE</Text>
        </View>
      )}
      {locked && (
        <View style={styles.badgeLock}><Lock size={10} color={colors.textSubtle} /></View>
      )}
      <ProgressRing progress={progress} size={54} stroke={5} trackColor={locked ? 'rgba(154,161,171,0.18)' : 'rgba(46,139,238,0.12)'}>
        <Text style={[styles.badgeEmoji, locked && { opacity: 0.4 }]}>{badge.emoji}</Text>
      </ProgressRing>
      <Text style={[styles.badgeName, locked && { color: colors.textSubtle }]} numberOfLines={1}>{badge.name}</Text>
      {badge.status === 'progress' && <Text style={styles.badgeProgress}>{progress}%</Text>}
      {badge.status === 'unlocked' && <Text style={styles.badgeUnlocked}>Unlocked</Text>}
      {locked && <Text style={styles.badgeLocked}>Locked</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  heroCard: { backgroundColor: '#1a1d24', borderRadius: 24, padding: 16, marginTop: 8, ...shadows.float },
  heroCount: { fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 15 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, marginBottom: 4 },
  heroBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  heroStatsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroStat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 8 },
  heroStatValue: { fontSize: 14, fontWeight: '800', color: '#fff', marginTop: 2 },
  heroStatLabel: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionLabelText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  milestoneCard: { width: 88, alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card, position: 'relative' },
  milestoneCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, overflow: 'hidden', zIndex: 10 },
  milestoneLock: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#eef1f5', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  milestoneEmoji: { fontSize: 24 },
  milestoneLabel: { fontSize: 11, fontWeight: '700', color: colors.ink },
  milestoneProgress: { fontSize: 9, fontWeight: '500', color: colors.textSubtle },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  badgeCard: { width: '32%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 16, padding: 10, alignItems: 'center', gap: 4, ...shadows.card, position: 'relative' },
  rareBadge: { position: 'absolute', top: 6, left: 6, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden', zIndex: 10 },
  rareText: { fontSize: 7, fontWeight: '800', color: '#fff', position: 'relative' },
  badgeLock: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#eef1f5', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: 10.5, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  badgeProgress: { fontSize: 9, fontWeight: '700', color: colors.blue },
  badgeUnlocked: { fontSize: 9, fontWeight: '700', color: colors.success },
  badgeLocked: { fontSize: 9, fontWeight: '500', color: colors.textSubtle },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  recentName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  recentDesc: { fontSize: 10.5, color: colors.textSubtle },
  recentStatus: { fontSize: 10, fontWeight: '700', color: colors.success },
  recentDate: { fontSize: 10, color: colors.textSubtle },
})
