import React from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Settings as SettingsIcon, Bell, Palette, Globe, Volume2, Vibrate,
  Shield, CircleHelp, LogOut, ChevronRight, Crown, Pencil, Flame, Target, Trophy,
} from 'lucide-react-native'
import { JWordmark, PremiumBadge } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, Avatar, GradientButton } from '../components/primitives'
import { useStats, useLogout } from '../hooks/queries'
import { useAuthStore } from '../store/useAuthStore'
import { colors, gradients, shadows } from '../theme'

export default function ProfileScreen({
  onTab,
  onOpenSettings,
  onOpenAchievements,
}: {
  onTab?: (key: string) => void
  onOpenSettings?: () => void
  onOpenAchievements?: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { data: stats } = useStats()

  const name = user?.name ?? 'Guest'
  const email = user?.email ?? ''
  const streak = stats?.streakDays ?? 0
  const answered = stats?.totalAnswered ?? 0
  const level = stats?.currentLevel ?? 1
  const xp = stats?.totalXp ?? 0

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Gradient header */}
        <View style={{ overflow: 'hidden', borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
          <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <View style={styles.headerTop}>
              <JWordmark size={20} tone="light" />
              <Pressable onPress={onOpenSettings} style={styles.headerBtn}>
                <SettingsIcon size={18} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.profileRow}>
              <Avatar name={name} size={72} ring />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.name}>{name}</Text>
                  <PremiumBadge />
                </View>
                <Text style={styles.role}>{user?.role ?? 'Software Engineer'}</Text>
                <Text style={styles.email}>{email}</Text>
              </View>
              <Pressable style={styles.editBtn}><Pencil size={16} color="#fff" /></Pressable>
            </View>
            {/* Mini stats */}
            <View style={styles.miniStatsRow}>
              <MiniStat icon={<Flame size={16} color="#fff" />} value={String(streak)} label="Streak" />
              <MiniStat icon={<Target size={16} color="#fff" />} value={String(answered)} label="Answered" />
              <MiniStat icon={<Trophy size={16} color="#fff" />} value={`Lv ${level}`} label="Level" />
            </View>
          </LinearGradient>
        </View>

        {/* Premium card */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={styles.premiumCard}>
            <View style={styles.premiumIcon}>
              <LinearGradient colors={gradients.warm as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={20} color="#fff" />
              </LinearGradient>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.premiumTitle}>JobPrep Premium</Text>
                <View style={styles.activeBadge}><Text style={styles.activeText}>ACTIVE</Text></View>
              </View>
              <Text style={styles.premiumSub}>Unlimited decks · AI tutor · mock interviews</Text>
            </View>
          </View>
        </View>

        {/* Quick links */}
        <SectionLabel label="Quick links" />
        <View style={styles.cardGroup}>
          <NavRow icon={<Trophy size={16} color="#fff" />} tint={[colors.gold, colors.amber]} label="Achievements" sub="3 of 10 unlocked" onPress={onOpenAchievements} />
          <NavRow icon={<SettingsIcon size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Settings" sub="Account, notifications, privacy" onPress={onOpenSettings} last />
        </View>

        {/* Preferences */}
        <SectionLabel label="Preferences" style={{ marginTop: 20 }} />
        <View style={styles.cardGroup}>
          <NavRow icon={<Bell size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Notifications" value="On" />
          <NavRow icon={<Palette size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Appearance" value="Light" />
          <NavRow icon={<Globe size={16} color="#fff" />} tint={[colors.tealGreen, colors.gold]} label="Language" value="English" />
          <NavRow icon={<Volume2 size={16} color="#fff" />} tint={[colors.gold, colors.amber]} label="Sound effects" value="On" last />
        </View>

        {/* Account */}
        <SectionLabel label="Account" style={{ marginTop: 20 }} />
        <View style={styles.cardGroup}>
          <NavRow icon={<Shield size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Privacy & security" />
          <NavRow icon={<CircleHelp size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Help & support" />
          <Pressable
            style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.9 : 1 }, styles.navRowLast]}
            onPress={() => { logout.mutate() }}
          >
            <View style={[styles.navIcon, { overflow: 'hidden' }]}>
              <LinearGradient colors={[colors.orange, '#f43f5e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={16} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.navLabel, { color: colors.danger }]}>Sign out</Text>
            <ChevronRight size={16} color="#cdd2d9" />
          </Pressable>
        </View>

        <Text style={styles.footer}>JobPrep v2.4.1 · Made with 💛 in Accra</Text>
      </ScrollView>
      <BottomNav active="profile" onTab={onTab} />
    </View>
  )
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <View style={styles.miniStatIcon}>{icon}</View>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
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

function NavRow({ icon, tint, label, value, sub, onPress, last }: {
  icon: React.ReactNode; tint: string[]; label: string; value?: string; sub?: string; onPress?: () => void; last?: boolean
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navRow, !last && styles.navRowBorder, { opacity: pressed ? 0.9 : 1 }]}
      onPress={onPress}
    >
      <View style={{ width: 32, height: 32, borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navLabel}>{label}</Text>
        {sub && <Text style={styles.navSub}>{sub}</Text>}
      </View>
      {value && <Text style={styles.navValue}>{value}</Text>}
      <ChevronRight size={16} color="#cdd2d9" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  name: { fontSize: 19, fontWeight: '800', color: '#fff' },
  role: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  email: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  miniStatsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  miniStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  miniStatIcon: { width: 28, height: 28, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  miniStatValue: { fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 4 },
  miniStatLabel: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  premiumCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1d24', borderRadius: 20, padding: 16, ...shadows.float },
  premiumIcon: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
  premiumTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  activeBadge: { backgroundColor: 'rgba(242,201,76,0.2)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  activeText: { fontSize: 9, fontWeight: '800', color: colors.gold },
  premiumSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  cardGroup: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', ...shadows.card },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  navRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  navRowLast: {},
  navIcon: { width: 32, height: 32, borderRadius: 12 },
  navLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  navSub: { fontSize: 10, color: colors.textSubtle, marginTop: 2 },
  navValue: { fontSize: 12, fontWeight: '500', color: colors.textSubtle },
  footer: { textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textSubtle, marginTop: 20 },
})
