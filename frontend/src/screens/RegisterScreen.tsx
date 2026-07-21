import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Mail, Lock, Eye, EyeOff, ChevronRight, User, Check, X, ShieldCheck } from 'lucide-react-native'
import { JLogo } from '../components/JLogo'
import { useRegister } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'

type StrengthTier = { label: string; color: string }

function evaluatePwd(pwd: string) {
  const criteria = [
    { key: 'len', label: '8+ characters', met: pwd.length >= 8 },
    { key: 'upper', label: 'Uppercase letter', met: /[A-Z]/.test(pwd) },
    { key: 'num', label: 'Number', met: /[0-9]/.test(pwd) },
    { key: 'spec', label: 'Special character', met: /[^A-Za-z0-9]/.test(pwd) },
  ]
  const score = criteria.filter((c) => c.met).length
  const tier: StrengthTier =
    pwd.length === 0
      ? { label: '', color: '#cdd2d9' }
      : score <= 1
        ? { label: 'Weak', color: '#f43f5e' }
        : score === 2
          ? { label: 'Fair', color: '#f59e0b' }
          : score === 3
            ? { label: 'Good', color: '#18b6c5' }
            : { label: 'Strong', color: '#2e8bee' }
  return { criteria, score, tier }
}

export default function RegisterScreen({ onRegisterSuccess }: { onRegisterSuccess?: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [role, setRole] = useState('Software Engineer')
  const [agree, setAgree] = useState(true)

  const register = useRegister()
  const { criteria, score, tier } = useMemo(() => evaluatePwd(pwd), [pwd])
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const confirmTouched = confirm.length > 0
  const matches = confirmTouched && confirm === pwd

  const handleRegister = () => {
    if (!name || !email || !pwd || !agree || pwd !== confirm) return
    register.mutate(
      { name, email, password: pwd, role },
      { onSuccess: () => onRegisterSuccess?.() }
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      {/* Gradient hero */}
      <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.logoWrap}><JLogo size={56} variant="light" /></View>
        <Text style={styles.heroTitle}>Create your account</Text>
        <Text style={styles.heroSub}>Start prepping smarter — it's free.</Text>
      </LinearGradient>

      {/* Form */}
      <View style={styles.formCard}>
        <FieldRow icon={<User size={16} color={colors.textSubtle} />} placeholder="Full name" value={name} onChangeText={setName} />
        <FieldRow icon={<Mail size={16} color={colors.textSubtle} />} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
          trailing={email.length > 0 ? (emailValid ? <Check size={16} color={colors.success} strokeWidth={3} /> : <X size={16} color={colors.danger} strokeWidth={3} />) : null}
        />
        {email.length > 0 && !emailValid && <Text style={styles.hintError}>Please enter a valid email address.</Text>}

        {/* Password */}
        <FieldRow icon={<Lock size={16} color={colors.textSubtle} />} placeholder="Password" value={pwd} onChangeText={setPwd} secureTextEntry={!showPwd}
          trailing={<Pressable onPress={() => setShowPwd((s) => !s)}>{showPwd ? <EyeOff size={16} color={colors.textSubtle} /> : <Eye size={16} color={colors.textSubtle} />}</Pressable>}
        />

        {/* Strength meter */}
        {pwd.length > 0 && (
          <View style={styles.strengthBox}>
            <View style={styles.strengthRow}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.strengthSeg, { backgroundColor: i < score ? tier.color : '#e3e7ee' }]} />
              ))}
              <Text style={[styles.strengthLabel, { color: tier.color }]}>{tier.label}</Text>
            </View>
            <View style={styles.criteriaGrid}>
              {criteria.map((c) => (
                <View key={c.key} style={styles.criteriaItem}>
                  <View style={[styles.criteriaDot, { backgroundColor: c.met ? undefined : '#e3e7ee' }]}>
                    {c.met && <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.criteriaDotFill} />}
                    {c.met ? <Check size={10} color="#fff" strokeWidth={3.5} style={{ position: 'absolute' }} /> : <View style={styles.criteriaDotInner} />}
                  </View>
                  <Text style={[styles.criteriaText, { color: c.met ? colors.ink : colors.textSubtle }]}>{c.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Confirm password */}
        <FieldRow icon={<Lock size={16} color={colors.textSubtle} />} placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm}
          trailing={<Pressable onPress={() => setShowConfirm((s) => !s)}>{showConfirm ? <EyeOff size={16} color={colors.textSubtle} /> : <Eye size={16} color={colors.textSubtle} />}</Pressable>}
        />
        {confirmTouched && (
          <View style={[styles.hintRow, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            {matches ? <ShieldCheck size={14} color={colors.success} /> : <X size={14} color={colors.danger} />}
            <Text style={[styles.hintText, { color: matches ? colors.success : colors.danger }]}>
              {matches ? 'Passwords match' : "Passwords don't match"}
            </Text>
          </View>
        )}

        {/* Role chips */}
        <Text style={styles.fieldLabel}>I'm preparing for</Text>
        <View style={styles.chipRow}>
          {['Software Engineer', 'Frontend Dev', 'Data Scientist', 'Designer', 'Product Manager'].map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, role === r && styles.chipActive]}>
              {role === r && (
                <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              )}
              <Text style={[styles.chipText, role === r && styles.chipTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        {/* Terms */}
        <Pressable style={styles.termsRow} onPress={() => setAgree((a) => !a)}>
          <View style={[styles.checkbox, agree && { overflow: 'hidden' }]}>
            {agree && <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
            {agree && <Check size={12} color="#fff" strokeWidth={3} style={{ position: 'relative' }} />}
          </View>
          <Text style={styles.termsText}>
            I agree to JobPrep's <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </Pressable>

        {register.isError && (
          <Text style={styles.errorText}>
            {(register.error as any)?.response?.data?.message ?? 'Registration failed. Email may already be in use.'}
          </Text>
        )}

        {/* CTA */}
        <Pressable onPress={handleRegister} disabled={register.isPending} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            {register.isPending ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Text style={styles.ctaText}>Create account</Text><ChevronRight size={16} color="#fff" /></>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  )
}

/* ── Field row helper ────────────────────────────────────────── */
function FieldRow({
  icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, trailing,
}: {
  icon: React.ReactNode; placeholder: string; value: string; onChangeText: (t: string) => void
  secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address'; autoCapitalize?: 'none' | 'sentences'
  trailing?: React.ReactNode
}) {
  return (
    <View style={styles.inputRow}>
      {icon}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
      {trailing}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { height: 200, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', justifyContent: 'center', paddingBottom: 24 },
  logoWrap: { marginBottom: 14 },
  heroTitle: { fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 12.5, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  formCard: { marginHorizontal: 20, marginTop: -20, backgroundColor: '#fff', borderRadius: 24, padding: 16, ...shadows.float },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceMuted, borderRadius: 16, paddingHorizontal: 14, height: 44, marginBottom: 10 },
  input: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.ink, padding: 0 },
  hintError: { fontSize: 11, fontWeight: '600', color: colors.danger, marginTop: -4, marginBottom: 8, paddingHorizontal: 4 },
  hintRow: { marginTop: -4, marginBottom: 8, paddingHorizontal: 4 },
  hintText: { fontSize: 11, fontWeight: '700' },
  strengthBox: { backgroundColor: '#f8faff', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(46,139,238,0.08)' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strengthSeg: { flex: 1, height: 6, borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontWeight: '800' },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  criteriaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%' },
  criteriaDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  criteriaDotFill: { position: 'absolute', width: 16, height: 16, borderRadius: 8 },
  criteriaDotInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textSubtle },
  criteriaText: { fontSize: 10.5, fontWeight: '600' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  chipActive: { borderWidth: 0, ...shadows.soft },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 },
  checkbox: { width: 16, height: 16, borderRadius: 4, marginTop: 2, backgroundColor: '#eef1f5', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  termsText: { flex: 1, fontSize: 11, lineHeight: 16, color: colors.textMuted },
  link: { fontWeight: '600', color: colors.blue },
  errorText: { fontSize: 12, fontWeight: '600', color: colors.danger, marginBottom: 8 },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
