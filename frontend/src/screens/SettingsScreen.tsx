import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft, ChevronRight, Bell, Target, Palette, Shield, CircleHelp,
  LogOut, Volume2, Vibrate, Download, Trash2, Globe, Moon, Crown, Mail,
  Smartphone, Database, FileText, ThumbsUp, Flame,
} from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { Avatar } from '../components/primitives'
import { useLogout } from '../hooks/queries'
import { useAuthStore } from '../store/useAuthStore'
import { colors, gradients, shadows } from '../theme'
import PaywallScreen from './PaywallScreen'

export default function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const [notif, setNotif] = useState(true)
  const [sound, setSound] = useState(true)
  const [haptics, setHaptics] = useState(true)
  const [streakAlerts, setStreakAlerts] = useState(true)
  const [adaptive, setAdaptive] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [paywallVisible, setPaywallVisible] = useState(false)

  const subscriptionValue = user?.isPremium ? 'Premium · Active' : 'Free · Tap to upgrade'

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onBack}><ChevronLeft size={20} color={colors.ink} /></Pressable>
          <Text style={styles.title}>Settings</Text>
          <JWordmark size={18} tone="dark" />
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable style={({ pressed }) => [styles.profileCard, { opacity: pressed ? 0.97 : 1 }]}>
            <Avatar name={user?.name ?? 'Guest'} size={48} ring />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name ?? 'Guest'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
              <View style={styles.premiumTag}><Crown size={10} color={colors.warning} /><Text style={styles.premiumTagText}>PREMIUM</Text></View>
            </View>
            <ChevronRight size={16} color="#cdd2d9" />
          </Pressable>
        </View>

        {/* Account */}
        <SectionLabel label="Account" />
        <View style={styles.cardGroup}>
          <NavRow icon={<Mail size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Email & password" value="Verified" />
          <NavRow icon={<Smartphone size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Linked devices" value="2 devices" />
          <NavRow icon={<Crown size={16} color="#fff" />} tint={[colors.gold, colors.orange]} label="Subscription" value={subscriptionValue} onPress={() => setPaywallVisible(true)} last />
        </View>

        {/* Notifications */}
        <SectionLabel label="Notifications" style={{ marginTop: 20 }} />
        <View style={styles.cardGroup}>
          <ToggleRow icon={<Bell size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Push notifications" desc="Tutor replies, achievements" on={notif} onToggle={() => setNotif((s) => !s)} />
          <ToggleRow icon={<Flame size={16} color="#fff" />} tint={[colors.amber, colors.orange]} label="Streak alerts" desc="Remind me to practice daily" on={streakAlerts} onToggle={() => setStreakAlerts((s) => !s)} />
          <ToggleRow icon={<Volume2 size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Sound effects" on={sound} onToggle={() => setSound((s) => !s)} />
          <ToggleRow icon={<Vibrate size={16} color="#fff" />} tint={[colors.tealGreen, colors.gold]} label="Haptics" on={haptics} onToggle={() => setHaptics((s) => !s)} last />
        </View>

        {/* Practice */}
        <SectionLabel label="Practice" style={{ marginTop: 20 }} />
        <View style={styles.cardGroup}>
          <ToggleRow icon={<Target size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Adaptive difficulty" desc="Auto-adjust to your level" on={adaptive} onToggle={() => setAdaptive((s) => !s)} />
          <ToggleRow icon={<Palette size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Auto-play next question" on={autoPlay} onToggle={() => setAutoPlay((s) => !s)} />
          <NavRow icon={<Globe size={16} color="#fff" />} tint={[colors.tealGreen, colors.gold]} label="Language" value="English" last />
        </View>

        {/* Appearance */}
        <SectionLabel label="Appearance" style={{ marginTop: 20 }} />
        <View style={styles.cardGroup}>
          <ToggleRow icon={<Moon size={16} color="#fff" />} tint={['#8b5cf6', colors.blue]} label="Dark mode" desc="Follow system is off" on={darkMode} onToggle={() => setDarkMode((s) => !s)} />
          <NavRow icon={<Palette size={16} color="#fff" />} tint={[colors.gold, colors.amber]} label="Accent color" value="Gradient" last />
        </View>

        {/* Privacy & data */}
        <SectionLabel label="Privacy & data" style={{ marginTop: 20 }} />
        <View style={styles.cardGroup}>
          <NavRow icon={<Shield size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Privacy controls" />
          <NavRow icon={<Download size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Download my data" />
          <NavRow icon={<Database size={16} color="#fff" />} tint={[colors.gold, colors.amber]} label="Storage" value="48 MB used" />
          <NavRow icon={<Trash2 size={16} color="#fff" />} tint={[colors.orange, '#f43f5e']} label="Clear cache" value="12 MB" danger last />
        </View>

        {/* Support */}
        <SectionLabel label="Support" style={{ marginTop: 20 }} />
        <View style={styles.cardGroup}>
          <NavRow icon={<CircleHelp size={16} color="#fff" />} tint={[colors.blue, colors.teal]} label="Help center" />
          <NavRow icon={<FileText size={16} color="#fff" />} tint={[colors.teal, colors.tealGreen]} label="Terms & privacy" />
          <NavRow icon={<ThumbsUp size={16} color="#fff" />} tint={[colors.gold, colors.amber]} label="Rate JobPrep" last />
        </View>

        {/* Sign out */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable
            style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => logout.mutate()}
          >
            <LogOut size={16} color={colors.danger} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={styles.versionText}>JobPrep v2.4.1</Text>
          <Text style={styles.madeText}>Made with 💛 in Accra</Text>
        </View>
      </ScrollView>

      {/* Premium upsell modal — opened from the Subscription row. */}
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
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

function NavRow({ icon, tint, label, value, last, danger, onPress }: {
  icon: React.ReactNode; tint: string[]; label: string; value?: string; last?: boolean; danger?: boolean; onPress?: () => void
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navRow, !last && styles.navRowBorder, { opacity: pressed ? 0.9 : 1 }]}>
      <View style={{ width: 32, height: 32, borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      </View>
      <Text style={[styles.navLabel, danger && { color: colors.danger }]}>{label}</Text>
      {value && <Text style={styles.navValue}>{value}</Text>}
      <ChevronRight size={16} color="#cdd2d9" />
    </Pressable>
  )
}

function ToggleRow({ icon, tint, label, desc, on, onToggle, last }: {
  icon: React.ReactNode; tint: string[]; label: string; desc?: string; on: boolean; onToggle: () => void; last?: boolean
}) {
  return (
    <View style={[styles.navRow, !last && styles.navRowBorder]}>
      <View style={{ width: 32, height: 32, borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navLabel}>{label}</Text>
        {desc && <Text style={styles.navDesc}>{desc}</Text>}
      </View>
      <Pressable onPress={onToggle} style={{ width: 44, height: 24, borderRadius: 12, overflow: 'hidden', justifyContent: 'center' }}>
        {on && <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
        {!on && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e3e7ee' }]} />}
        <View style={[styles.toggleKnob, on ? { right: 2 } : { left: 2 }]} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  profileName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  profileEmail: { fontSize: 11, color: colors.textSubtle },
  premiumTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, backgroundColor: '#fff8ec', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start' },
  premiumTagText: { fontSize: 8, fontWeight: '800', color: colors.warning },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  cardGroup: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', ...shadows.card },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  navRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  navLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  navDesc: { fontSize: 10, color: colors.textSubtle, marginTop: 2 },
  navValue: { fontSize: 12, fontWeight: '500', color: colors.textSubtle },
  toggleKnob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', ...shadows.card },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, height: 48, ...shadows.card },
  signOutText: { fontSize: 13, fontWeight: '700', color: colors.danger },
  versionText: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  madeText: { fontSize: 10, color: '#cdd2d9', marginTop: 2 },
})
