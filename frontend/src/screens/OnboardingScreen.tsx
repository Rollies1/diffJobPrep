import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Target, Bot, TrendingUp, ChevronRight } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { GradientButton } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

const STEPS = [
  { emoji: '🎯', title: 'Targeted practice', desc: 'Smart decks adapt to the exact roles and companies you are chasing.' },
  { emoji: '🤖', title: 'Your AI interview coach', desc: 'Get instant, personalized feedback on every answer — anytime.' },
  { emoji: '📈', title: 'Track real progress', desc: 'Watch your accuracy, confidence and streak climb week over week.' },
]

const FEATURES = [
  { icon: Target, label: 'Personalized question decks', tint: [colors.blue, colors.teal] as string[] },
  { icon: Bot, label: 'AI tutor available 24/7', tint: [colors.teal, colors.tealGreen] as string[] },
  { icon: TrendingUp, label: 'Detailed progress analytics', tint: [colors.gold, colors.orange] as string[] },
]

export default function OnboardingScreen({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else onComplete?.()
  }

  return (
    <View style={styles.container}>
      {/* Top gradient */}
      <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTop}>
          <JWordmark size={22} tone="light" />
          <Pressable onPress={onComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationCircle}>
            <Text style={styles.illustrationEmoji}>{current.emoji}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step ? styles.dotActive : null, i === step && { overflow: 'hidden' }]}>
              {i === step && <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
            </View>
          ))}
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.desc}</Text>

        {/* Feature cards */}
        <View style={{ gap: 10, marginTop: 24 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <View key={i} style={styles.featureCard}>
                <View style={{ width: 36, height: 36, borderRadius: 12, overflow: 'hidden' }}>
                  <LinearGradient colors={f.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <ChevronRight size={16} color={colors.textSubtle} />
              </View>
            )
          })}
        </View>

        {/* CTA */}
        <View style={{ marginTop: 'auto', paddingTop: 24 }}>
          <Pressable onPress={next} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Text style={styles.ctaText}>{step < STEPS.length - 1 ? 'Continue' : 'Get started'}</Text>
              <ChevronRight size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { height: 340, borderBottomLeftRadius: 44, borderBottomRightRadius: 44 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  skipBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  skipText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  illustrationWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  illustrationCircle: { width: 128, height: 128, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  illustrationEmoji: { fontSize: 64 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e3e7ee' },
  dotActive: { width: 28, height: 6, borderRadius: 3 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, textAlign: 'center', marginTop: 24, letterSpacing: -0.3 },
  desc: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  featureLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
