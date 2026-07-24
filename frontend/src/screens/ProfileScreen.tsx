import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Linking,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronRight,
  User as UserIcon,
  Mail,
  Lock,
  Bell,
  Globe,
  Moon,
  FileText,
  LogOut,
  Check,
  X,
  Edit3,
  Crown,
  Sparkles,
} from 'lucide-react-native'
import { Avatar } from '../components/primitives'
import { useAuthStore } from '../store/useAuthStore'
import { useLogout, useUpdateProfile, useChangePassword } from '../hooks/queries'
import { useAppearanceStore } from '../stores/useAppearanceStore'
import { gradients, shadows } from '../theme'
import { useThemeColors } from '../theme/useThemeColors'
import PaywallScreen from './PaywallScreen'

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const c = useThemeColors()

  // Account editing state
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [name, setName] = useState(user?.name ?? '')

  // Password change state
  const [showPwd, setShowPwd] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')

  // Preferences
  const themeMode = useAppearanceStore((s) => s.mode)
  const setThemeMode = useAppearanceStore((s) => s.setMode)
  const [notifEnabled, setNotifEnabled] = useState(true)

  // Premium upsell
  const [paywallVisible, setPaywallVisible] = useState(false)

  const displayName = user?.name || user?.username || 'there'
  const avatarName = user?.username || user?.name || displayName

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { username, name, bio },
      {
        onSuccess: () => {
          setEditing(false)
          Alert.alert('Saved', 'Your profile has been updated.')
        },
        onError: (e: any) =>
          Alert.alert('Error', e?.response?.data?.message ?? 'Could not update profile.'),
      },
    )
  }

  const handleChangePassword = () => {
    if (!currentPwd || !newPwd || newPwd.length < 8) {
      Alert.alert('Check input', 'New password must be at least 8 characters.')
      return
    }
    changePassword.mutate(
      { currentPassword: currentPwd, newPassword: newPwd },
      {
        onSuccess: () => {
          setShowPwd(false)
          setCurrentPwd('')
          setNewPwd('')
          Alert.alert('Success', 'Your password has been changed.')
        },
        onError: (e: any) =>
          Alert.alert('Error', e?.response?.data?.message ?? 'Could not change password.'),
      },
    )
  }

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          logout.mutate()
        },
      },
    ])
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.ink }]}>Profile</Text>
      </View>

      {/* Profile card */}
      <View style={styles.profileCardWrap}>
        <View style={[styles.profileCard, { backgroundColor: c.surface }, shadows.card]}>
          <Avatar name={avatarName} size={72} ring />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.profileName, { color: c.ink }]} numberOfLines={1}>{displayName}</Text>
            <Text style={[styles.profileEmail, { color: c.textMuted }]} numberOfLines={1}>{user?.email}</Text>
            {user?.username && (
              <Text style={[styles.profileUsername, { color: c.blue }]}>@{user.username}</Text>
            )}
            {user?.isPremium && (
              <View style={styles.premiumPill}>
                <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumFill} />
                <Text style={styles.premiumText}>★ PREMIUM</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => setEditing((e) => !e)} style={styles.editBtn}>
            <Edit3 size={16} color={c.blue} />
          </Pressable>
        </View>
      </View>

      {/* Premium upgrade banner — only for non-premium users. */}
      {!user?.isPremium && (
        <View style={styles.sectionWrap}>
          <Pressable
            onPress={() => setPaywallVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
          >
            <LinearGradient
              colors={gradients.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeCard}
            >
              <View style={styles.upgradeIcon}>
                <Crown size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>Unlock JobPrep Premium</Text>
                <Text style={styles.upgradeSub}>1,200+ questions · AI tutor · mock interviews</Text>
              </View>
              <View style={styles.upgradeCta}>
                <Sparkles size={12} color={c.blue} />
                <Text style={styles.upgradeCtaText}>Upgrade</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {/* Account section */}
      <SectionHeader label="Account" color={c.textSubtle} />
      <View style={styles.sectionWrap}>
        <View style={[styles.card, { backgroundColor: c.surface }, shadows.card]}>
          {editing ? (
            <>
              <EditField label="Name" value={name} onChangeText={setName} placeholder="Your name" color={c} />
              <Divider color={c.divider} />
              <EditField label="Username" value={username} onChangeText={setUsername} placeholder="username" color={c} prefix="@" />
              <Divider color={c.divider} />
              <EditField label="Email" value={user?.email ?? ''} onChangeText={() => {}} placeholder="email" color={c} editable={false} />
              <Divider color={c.divider} />
              <EditField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell us about yourself" color={c} multiline />
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditing(false)} style={[styles.cancelBtn, { borderColor: c.border }]}>
                  <Text style={[styles.cancelText, { color: c.textMuted }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSaveProfile} disabled={updateProfile.isPending} style={styles.saveBtnWrap}>
                  <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBtn}>
                    {updateProfile.isPending ? <ActivityIndicator color="#fff" size="small" /> : <><Check size={14} color="#fff" /><Text style={styles.saveBtnText}>Save</Text></>}
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <InfoRow icon={<UserIcon size={16} color={c.textSubtle} />} label="Name" value={displayName} color={c} />
              <Divider color={c.divider} />
              <InfoRow icon={<UserIcon size={16} color={c.textSubtle} />} label="Username" value={user?.username ? `@${user.username}` : '—'} color={c} />
              <Divider color={c.divider} />
              <InfoRow icon={<Mail size={16} color={c.textSubtle} />} label="Email" value={user?.email ?? '—'} color={c} />
              <Divider color={c.divider} />
              <InfoRow icon={<FileText size={16} color={c.textSubtle} />} label="Bio" value={user?.bio || 'No bio yet'} color={c} />
              <Divider color={c.divider} />
              <Pressable onPress={() => setShowPwd((s) => !s)} style={styles.actionRow}>
                <View style={[styles.actionIcon, { backgroundColor: c.dangerBg }]}><Lock size={14} color={c.danger} /></View>
                <Text style={[styles.actionLabel, { color: c.ink }]}>Reset password</Text>
                <ChevronRight size={16} color={c.textSubtle} />
              </Pressable>
            </>
          )}
        </View>

        {/* Password change form */}
        {showPwd && (
          <View style={[styles.card, { backgroundColor: c.surface, marginTop: 10 }, shadows.card]}>
            <Text style={[styles.cardTitle, { color: c.ink }]}>Change password</Text>
            <PwdInput placeholder="Current password" value={currentPwd} onChangeText={setCurrentPwd} color={c} />
            <PwdInput placeholder="New password (min 8 chars)" value={newPwd} onChangeText={setNewPwd} color={c} />
            <Pressable onPress={handleChangePassword} disabled={changePassword.isPending} style={styles.pwdSaveWrap}>
              <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pwdSaveBtn}>
                {changePassword.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Update password</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </View>

      {/* Preferences section */}
      <SectionHeader label="Preferences" color={c.textSubtle} />
      <View style={styles.sectionWrap}>
        <View style={[styles.card, { backgroundColor: c.surface }, shadows.card]}>
          {/* Theme toggle */}
          <View style={styles.prefRow}>
            <View style={[styles.prefIcon, { backgroundColor: c.infoBg }]}><Moon size={14} color={c.blue} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefLabel, { color: c.ink }]}>Dark mode</Text>
              <Text style={[styles.prefSub, { color: c.textSubtle }]}>Switch between light and dark themes</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
              trackColor={{ false: c.border, true: c.blue }}
            />
          </View>
          <Divider color={c.divider} />
          {/* Notifications */}
          <View style={styles.prefRow}>
            <View style={[styles.prefIcon, { backgroundColor: c.warningBg }]}><Bell size={14} color={c.warning} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefLabel, { color: c.ink }]}>Push notifications</Text>
              <Text style={[styles.prefSub, { color: c.textSubtle }]}>Daily reminders & streak alerts</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: c.border, true: c.blue }}
            />
          </View>
          <Divider color={c.divider} />
          {/* Language */}
          <Pressable style={styles.prefRow} onPress={() => Alert.alert('Language', 'Language selection coming soon.')}>
            <View style={[styles.prefIcon, { backgroundColor: c.successBg }]}><Globe size={14} color={c.success} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefLabel, { color: c.ink }]}>Language</Text>
              <Text style={[styles.prefSub, { color: c.textSubtle }]}>English</Text>
            </View>
            <ChevronRight size={16} color={c.textSubtle} />
          </Pressable>
        </View>
      </View>

      {/* About section */}
      <SectionHeader label="About" color={c.textSubtle} />
      <View style={styles.sectionWrap}>
        <View style={[styles.card, { backgroundColor: c.surface }, shadows.card]}>
          <Pressable style={styles.prefRow} onPress={() => Linking.openURL('https://jobprep.app/privacy')}>
            <View style={[styles.prefIcon, { backgroundColor: c.surfaceMuted }]}><FileText size={14} color={c.textMuted} /></View>
            <Text style={[styles.prefLabel, { color: c.ink }]}>Privacy policy</Text>
            <ChevronRight size={16} color={c.textSubtle} />
          </Pressable>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.sectionWrap}>
        <Pressable onPress={handleLogout} disabled={logout.isPending} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <View style={[styles.logoutBtn, { backgroundColor: c.surface, borderColor: c.dangerBg }, shadows.card]}>
            {logout.isPending ? (
              <ActivityIndicator color={c.danger} size="small" />
            ) : (
              <>
                <LogOut size={16} color={c.danger} />
                <Text style={[styles.logoutText, { color: c.danger }]}>Sign out</Text>
              </>
            )}
          </View>
        </Pressable>
      </View>

      <Text style={[styles.version, { color: c.textSubtle }]}>JobPrep v1.0.0</Text>
    </ScrollView>

      {/* Premium upsell modal — opened from the upgrade banner. */}
      <PaywallScreen visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </>
  )
}

/* ── helpers ────────────────────────────────────────────────────── */

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  )
}

function Divider({ color }: { color: string }) {
  return <View style={{ height: 1, backgroundColor: color, marginVertical: 0 }} />
}

function InfoRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: any }) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.infoLabel, { color: color.textSubtle }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: color.ink }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  )
}

function EditField({ label, value, onChangeText, placeholder, color, prefix, multiline, editable = true }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder: string; color: any
  prefix?: string; multiline?: boolean; editable?: boolean
}) {
  return (
    <View style={styles.editField}>
      <Text style={[styles.infoLabel, { color: color.textSubtle }]}>{label}</Text>
      <View style={[styles.editInputRow, { backgroundColor: color.surfaceMuted, opacity: editable ? 1 : 0.6 }]}>
        {prefix && <Text style={[styles.prefixText, { color: color.textSubtle }]}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={color.textSubtle}
          editable={editable}
          multiline={multiline}
          style={[styles.editInput, { color: color.ink }]}
        />
      </View>
    </View>
  )
}

function PwdInput({ placeholder, value, onChangeText, color }: { placeholder: string; value: string; onChangeText: (t: string) => void; color: any }) {
  return (
    <View style={[styles.editInputRow, { backgroundColor: color.surfaceMuted, marginTop: 8 }]}>
      <Lock size={14} color={color.textSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.textSubtle}
        secureTextEntry
        style={[styles.editInput, { color: color.ink }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  profileCardWrap: { paddingHorizontal: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16 },
  profileName: { fontSize: 18, fontWeight: '800' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  profileUsername: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  premiumPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6, overflow: 'hidden', alignSelf: 'flex-start' },
  premiumFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  premiumText: { fontSize: 9, fontWeight: '800', color: '#fff', position: 'relative' },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  sectionWrap: { paddingHorizontal: 16 },
  card: { borderRadius: 18, padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  actionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  editField: { paddingVertical: 8 },
  editInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 12, height: 42, marginTop: 4 },
  prefixText: { fontSize: 13, fontWeight: '600' },
  editInput: { flex: 1, fontSize: 13, fontWeight: '500', padding: 0 },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cancelBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cancelText: { fontSize: 13, fontWeight: '700' },
  saveBtnWrap: { flex: 1 },
  saveBtn: { height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  pwdSaveWrap: { marginTop: 8 },
  pwdSaveBtn: { height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  prefIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  prefLabel: { fontSize: 14, fontWeight: '600' },
  prefSub: { fontSize: 11, marginTop: 2 },
  logoutBtn: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1 },
  logoutText: { fontSize: 14, fontWeight: '700' },
  version: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 20 },
  upgradeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, ...shadows.soft },
  upgradeIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  upgradeTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  upgradeSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  upgradeCta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  upgradeCtaText: { fontSize: 12, fontWeight: '800' },
})
