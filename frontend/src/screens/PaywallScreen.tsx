import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { X, Check, Crown, Sparkles } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { GradientButton } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

const FEATURES = [
  { icon: '📚', title: '1,200+ premium questions', desc: 'Curated by FAANG engineers' },
  { icon: '🤖', title: 'Unlimited AI tutor sessions', desc: '24/7 personalized feedback' },
  { icon: '🎤', title: 'Full mock interviews', desc: 'AI-scored, with recordings' },
  { icon: '📊', title: 'Advanced analytics', desc: 'Deep skill & trend insights' },
  { icon: '🎯', title: 'Company-specific decks', desc: 'Amazon, Meta, Google & more' },
]

export default function PaywallScreen({ visible, onClose }: { visible: boolean; onClose?: () => void }) {
  const [plan, setPlan] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly')

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* grabber */}
          <View style={styles.grabber} />
          {/* brand */}
          <View style={{ position: 'absolute', left: 16, top: 14 }}><JWordmark size={18} tone="dark" /></View>
          {/* close */}
          <Pressable style={styles.closeBtn} onPress={onClose}><X size={16} color={colors.textMuted} /></Pressable>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 36, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={styles.heroIcon}>
              <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Unlock <Text style={styles.titleHighlight}>JobPrep Premium</Text></Text>
            <Text style={styles.sub}>Everything you need to walk into any interview calm, sharp & ready.</Text>

            {/* Features */}
            <View style={{ gap: 10, marginTop: 20 }}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIcon}><Text style={{ fontSize: 18 }}>{f.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                  <View style={styles.featureCheck}>
                    <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </LinearGradient>
                  </View>
                </View>
              ))}
            </View>

            {/* Plans */}
            <View style={styles.plansRow}>
              <PlanCard label="Monthly" price="$9.99" sub="/mo" active={plan === 'monthly'} onPress={() => setPlan('monthly')} badge="" />
              <PlanCard label="Yearly" price="$4.99" sub="/mo" active={plan === 'yearly'} onPress={() => setPlan('yearly')} badge="SAVE 50%" />
              <PlanCard label="Lifetime" price="$149" sub="once" active={plan === 'lifetime'} onPress={() => setPlan('lifetime')} badge="BEST" />
            </View>

            {/* CTA */}
            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Sparkles size={16} color="#fff" />
                <Text style={styles.ctaText}>Start 7-day free trial</Text>
              </LinearGradient>
            </Pressable>
            <Text style={styles.ctaSub}>Cancel anytime · billed as {plan === 'lifetime' ? '$149 once' : plan === 'yearly' ? '$59.88/year' : '$9.99/mo'}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 }}>
              <Text style={styles.linkText}>Restore purchases</Text>
              <View style={styles.linkDivider} />
              <Text style={styles.linkText}>Terms</Text>
              <View style={styles.linkDivider} />
              <Text style={styles.linkText}>Privacy</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function PlanCard({ label, price, sub, active, onPress, badge }: { label: string; price: string; sub: string; active: boolean; onPress: () => void; badge: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        active && { overflow: 'hidden', ...shadows.soft },
        { opacity: pressed ? 0.95 : 1 },
      ]}
    >
      {active && <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      {badge !== '' && (
        <View style={[styles.planBadge, active && { overflow: 'hidden' }]}>
          {active ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Text style={[styles.planBadgeText, { color: colors.blue }]}>{badge}</Text>
            </View>
          ) : (
            <View style={{ overflow: 'hidden', borderRadius: 999 }}>
              <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={styles.planBadgeText}>{badge}</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      )}
      <Text style={[styles.planLabel, active && { color: 'rgba(255,255,255,0.85)' }]}>{label}</Text>
      <Text style={[styles.planPrice, active && { color: '#fff' }]}>{price}</Text>
      <Text style={[styles.planSub, active && { color: 'rgba(255,255,255,0.7)' }]}>{sub}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '94%', backgroundColor: '#fff', borderTopLeftRadius: 34, borderTopRightRadius: 34 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e3e7ee', alignSelf: 'center', marginTop: 10 },
  closeBtn: { position: 'absolute', right: 16, top: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center' },
  heroIcon: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', alignSelf: 'center', ...shadows.float },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center', marginTop: 16 },
  titleHighlight: { color: colors.blue },
  sub: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8faff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(46,139,238,0.08)' },
  featureIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  featureDesc: { fontSize: 10, color: colors.textSubtle },
  featureCheck: { width: 20, height: 20, borderRadius: 10, overflow: 'hidden' },
  plansRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  planCard: { flex: 1, borderRadius: 16, borderWidth: 2, borderColor: '#e3e7ee', backgroundColor: '#fff', paddingVertical: 10, alignItems: 'center', position: 'relative' },
  planBadge: { position: 'absolute', top: -8, left: '50%', marginLeft: -30, width: 60, alignItems: 'center' },
  planBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff' },
  planLabel: { fontSize: 10, fontWeight: '700', color: colors.textSubtle },
  planPrice: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  planSub: { fontSize: 8, color: colors.textSubtle, marginTop: 2 },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 20, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 10, color: colors.textSubtle, textAlign: 'center', marginTop: 8 },
  linkText: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  linkDivider: { width: 1, height: 12, backgroundColor: '#e3e7ee' },
})
