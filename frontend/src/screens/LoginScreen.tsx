import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Mail, Lock, Eye, EyeOff, ChevronRight, Fingerprint } from 'lucide-react-native'
import { JLogo } from '../components/JLogo'
import { GoogleIcon } from '../components/GoogleIcon'
import { useLogin } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'

export default function LoginScreen({ onLoginSuccess, onRegister }: { onLoginSuccess?: () => void; onRegister?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const login = useLogin()

  const handleLogin = () => {
    if (!email || !password) return
    login.mutate(
      { email, password },
      { onSuccess: () => onLoginSuccess?.() }
    )
  }

  return (
    <View style={styles.container}>
      {/* Gradient hero */}
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.logoWrap}>
          <JLogo size={64} variant="light" />
        </View>
        <Text style={styles.heroTitle}>JobPrep</Text>
        <Text style={styles.heroSubtitle}>Land your dream job, one answer at a time.</Text>
      </LinearGradient>

      {/* Form */}
      <View style={styles.formCard}>
        <Text style={styles.welcome}>Welcome back 👋</Text>
        <Text style={styles.welcomeSub}>Sign in to continue your prep</Text>

        <View style={styles.inputRow}>
          <Mail size={16} color={colors.textSubtle} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.textSubtle}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputRow}>
          <Lock size={16} color={colors.textSubtle} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSubtle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
          />
          <Pressable onPress={() => setShowPwd((s) => !s)}>
            {showPwd ? <EyeOff size={16} color={colors.textSubtle} /> : <Eye size={16} color={colors.textSubtle} />}
          </Pressable>
        </View>

        <Pressable style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        {login.isError && (
          <Text style={styles.errorText}>
            {(login.error as any)?.response?.data?.message ?? 'Login failed. Check your credentials.'}
          </Text>
        )}

        {/* Sign in button */}
        <Pressable onPress={handleLogin} disabled={login.isPending} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            {login.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.ctaText}>Sign in</Text>
                <ChevronRight size={16} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        {/* Social buttons */}
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn}>
            <GoogleIcon size={16} />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={[styles.socialBtn, { backgroundColor: colors.blue }]}>
            <Fingerprint size={16} color="#fff" />
            <Text style={[styles.socialText, { color: '#fff' }]}>Biometric</Text>
          </Pressable>
        </View>

        {/* Sign up link */}
        <Pressable onPress={onRegister} style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            Don't have an account? <Text style={{ fontWeight: '700', color: colors.blue }}>Create one</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: {
    height: 260,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
  },
  logoWrap: { marginBottom: 16 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  formCard: {
    marginHorizontal: 24,
    marginTop: -24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...shadows.float,
  },
  welcome: { fontSize: 18, fontWeight: '700', color: colors.ink },
  welcomeSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.ink, padding: 0 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 12 },
  forgotText: { fontSize: 12, fontWeight: '600', color: colors.blue },
  errorText: { fontSize: 12, fontWeight: '600', color: colors.danger, marginBottom: 8 },
  cta: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadows.soft,
  },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 11, fontWeight: '600', color: colors.textSubtle, marginHorizontal: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadows.card,
  },
  socialText: { fontSize: 13, fontWeight: '700', color: colors.ink },
})
