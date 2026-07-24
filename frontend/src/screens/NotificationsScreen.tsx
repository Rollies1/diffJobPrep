import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Settings2, CheckCheck, ChevronRight, Megaphone, Bell } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, Avatar } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

type Notif = {
  id: string; type: string; title: string; body: string; time: string
  unread?: boolean; emoji?: string; avatar?: string; cta?: string; tint: string[]
}

const TODAY: Notif[] = [
  { id: 't1', type: 'tutor', title: 'JobPrep AI', body: 'Great work on Two Pointers! Your accuracy jumped 4%. Ready for a harder challenge? 🎯', time: '2m', unread: true, avatar: 'AI', cta: 'Practice now', tint: ['#8b5cf6', colors.blue] },
  { id: 't2', type: 'achievement', title: 'Achievement unlocked!', body: 'You earned "Sharp Shooter" — scored 90%+ on a deck. 🎯', time: '1h', unread: true, emoji: '🎯', cta: 'View trophy room', tint: [colors.teal, colors.tealGreen] },
  { id: 't3', type: 'streak', title: "Don't break your streak! 🔥", body: "You're on a 13-day streak. Answer 1 question today to keep it alive.", time: '3h', unread: true, emoji: '🔥', cta: 'Quick practice', tint: [colors.amber, colors.orange] },
  { id: 't4', type: 'social', title: 'Kwame liked your answer', body: '"Your explanation of write-back caching was spot on." 💛', time: '5h', avatar: 'KA', cta: 'View answer', tint: [colors.orange, '#f43f5e'] },
]

const EARLIER: Notif[] = [
  { id: 'e1', type: 'rank', title: 'You climbed the leaderboard', body: "You're now ranked #142 — up 18 spots this week. Top 8% globally! 🏆", time: 'Yesterday', emoji: '🏆', cta: 'See leaderboard', tint: [colors.gold, colors.amber] },
  { id: 'e2', type: 'deck', title: 'New deck: React Internals 🧩', body: '15 hard questions curated for senior frontend roles.', time: 'Yesterday', emoji: '🧩', cta: 'Open deck', tint: [colors.blue, colors.teal] },
  { id: 'e3', type: 'system', title: 'Welcome to Premium 👑', body: 'You now have unlimited AI Tutor sessions & all premium decks.', time: '3 days ago', emoji: '👑', tint: [colors.gold, colors.orange] },
]

const FILTERS = [
  { key: 'all', label: 'All', count: 7 },
  { key: 'unread', label: 'Unread', count: 3 },
  { key: 'tutor', label: 'Tutor', count: 1 },
  { key: 'social', label: 'Social', count: 1 },
]

export default function NotificationsScreen({ onTab }: { onTab?: (key: string) => void }) {
  const [filter, setFilter] = useState('all')
  const filterFn = (list: Notif[]) =>
    filter === 'all' ? list : filter === 'unread' ? list.filter((n) => n.unread) : list.filter((n) => n.type === filter)
  const today = filterFn(TODAY)
  const earlier = filterFn(EARLIER)

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <JWordmark size={22} tone="dark" />
          <Pressable style={styles.iconBtn}><Settings2 size={17} color={colors.ink} /></Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>3 unread · today</Text>
          <Pressable style={styles.markAllBtn}>
            <CheckCheck size={14} color={colors.success} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView style={{ maxHeight: 44 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }} horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={({ pressed }) => [styles.chip, filter === f.key && { overflow: 'hidden', ...shadows.soft }, { opacity: pressed ? 0.9 : 1 }]}
            >
              {filter === f.key && <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
              <Text style={[styles.chipText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
              <View style={[styles.chipCount, filter === f.key && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={[styles.chipCountText, filter === f.key && { color: '#fff' }]}>{f.count}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Today */}
        {today.length > 0 && (
          <>
            <SectionLabel label="Today" />
            <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 6 }}>
              {today.map((n) => <NotifRow key={n.id} n={n} />)}
            </View>
          </>
        )}

        {/* Earlier */}
        {earlier.length > 0 && (
          <>
            <SectionLabel label="Earlier this week" style={{ marginTop: 20 }} />
            <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 6 }}>
              {earlier.map((n) => <NotifRow key={n.id} n={n} />)}
            </View>
          </>
        )}

        {today.length === 0 && earlier.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <View style={styles.emptyIcon}><Bell size={28} color="#cdd2d9" /></View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySub}>No notifications in this filter.</Text>
          </View>
        )}

        {/* Promo */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={styles.promoCard}>
            <View style={styles.promoIcon}><Megaphone size={18} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>Mock Interview Week is live 🎤</Text>
              <Text style={styles.promoSub}>Free mock interviews for all Premium members.</Text>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </View>

        <Text style={styles.footer}>That's everything from the past 7 days</Text>
      </ScrollView>
      <BottomNav active="profile" onTab={onTab} />
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

function NotifRow({ n }: { n: Notif }) {
  const lead = n.avatar
    ? <Avatar name={n.avatar === 'AI' ? 'JobPrep AI' : n.avatar} size={40} ring />
    : (
      <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient colors={n.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{n.emoji}</Text>
        </LinearGradient>
      </View>
    )

  return (
    <View style={[styles.notifRow, n.unread && { borderWidth: 1, borderColor: 'rgba(46,139,238,0.15)' }]}>
      {n.unread && <View style={styles.unreadBar} />}
      <View style={{ marginLeft: n.unread ? 6 : 0 }}>{lead}</View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
          <Text style={styles.notifTime}>{n.time}</Text>
        </View>
        <Text style={styles.notifBody}>{n.body}</Text>
        {n.cta && (
          <Pressable style={styles.ctaChip}>
            <Text style={styles.ctaText}>{n.cta}</Text>
            <ChevronRight size={12} color={colors.blue} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  iconBtn: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 11, fontWeight: '500', color: colors.textSubtle },
  markAllBtn: { position: 'absolute', right: 16, top: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, ...shadows.card },
  markAllText: { fontSize: 11, fontWeight: '700', color: colors.success },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipCount: { borderRadius: 999, paddingHorizontal: 6, backgroundColor: '#f5f7fa' },
  chipCountText: { fontSize: 9, fontWeight: '800', color: colors.textSubtle },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  notifRow: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card, position: 'relative' },
  unreadBar: { position: 'absolute', left: 6, top: '50%', marginTop: -16, width: 4, height: 32, borderRadius: 2, overflow: 'hidden' },
  notifTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink },
  notifTime: { fontSize: 10, fontWeight: '500', color: colors.textSubtle },
  notifBody: { fontSize: 11.5, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  ctaChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef4ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  ctaText: { fontSize: 10.5, fontWeight: '700', color: colors.blue },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 12 },
  emptySub: { fontSize: 12, color: colors.textSubtle, marginTop: 4 },
  promoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, overflow: 'hidden', ...shadows.float },
  promoIcon: { width: 36, height: 36, borderRadius: 12, overflow: 'hidden' },
  promoTitle: { fontSize: 12.5, fontWeight: '700', color: '#fff' },
  promoSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)' },
  footer: { textAlign: 'center', fontSize: 10, fontWeight: '600', color: colors.textSubtle, marginTop: 20 },
})
