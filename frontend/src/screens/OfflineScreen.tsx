import React from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import { RefreshCw, CloudDownload, FileText, History, Check, CloudOff, WifiOff, RefreshCcwDot } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { GradientButton } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

export default function OfflineScreen({ onRetry }: { onRetry?: () => void }) {
  const breath = useSharedValue(1)
  const breath2 = useSharedValue(1)
  React.useEffect(() => {
    breath.value = withRepeat(withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true)
    breath2.value = withRepeat(withTiming(1.06, { duration: 3500, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [])
  const ring1 = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }], opacity: 0.2 }))
  const ring2 = useAnimatedStyle(() => ({ transform: [{ scale: breath2.value }], opacity: 0.15 }))

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Brand bar */}
        <View style={styles.brandBar}>
          <JWordmark size={24} tone="dark" />
          <View style={styles.offlinePill}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.illustrationWrap}>
            <Animated.View style={[styles.ring1, ring1]} />
            <Animated.View style={[styles.ring2, ring2]} />
            <View style={styles.disc}>
              <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CloudOff size={48} color="#fff" strokeWidth={2} />
              </LinearGradient>
            </View>
          </View>
          <Text style={styles.title}>You're offline</Text>
          <Text style={styles.sub}>We can't reach JobPrep right now. Don't worry — your progress is saved and some content is ready to keep you prepping.</Text>
          <Pressable onPress={onRetry} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.ctaText}>Try reconnecting</Text>
            </LinearGradient>
          </Pressable>
          <View style={styles.retryInfo}>
            <RefreshCcwDot size={14} color={colors.textSubtle} />
            <Text style={styles.retryText}>Auto-retrying in 30s · Last synced 2 min ago</Text>
          </View>
        </View>

        {/* Available offline */}
        <SectionLabel icon={<CloudDownload size={14} color={colors.success} />} label="Available offline" badge="3 ready" />
        <View style={{ gap: 8, paddingHorizontal: 16, marginTop: 8 }}>
          <OfflineRow emoji="📚" title="Downloaded decks" meta="4 decks · 96 questions" tint={[colors.blue, colors.teal]} />
          <OfflineRow emoji="🎯" title="Last practice session" meta="Two Pointers · 7/8 done" tint={[colors.teal, colors.tealGreen]} />
          <OfflineRow emoji="📝" title="Your notes & history" meta="Synced just before disconnect" tint={[colors.gold, colors.amber]} />
        </View>

        {/* Needs connection */}
        <SectionLabel icon={<WifiOff size={14} color={colors.textSubtle} />} label="Needs a connection" style={{ marginTop: 20 }} />
        <View style={{ gap: 8, paddingHorizontal: 16, marginTop: 8 }}>
          <NeedsRow emoji="🤖" title="AI Tutor chat" meta="Live responses require the network" tint={['#8b5cf6', colors.blue]} />
          <NeedsRow emoji="☁️" title="Cloud sync & new decks" meta="Will resume when you reconnect" tint={[colors.textSubtle, colors.textMuted]} />
        </View>

        {/* Waiting footer */}
        <View style={styles.waitingRow}>
          <Text style={styles.waitingText}>Waiting for network</Text>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.waitingDot, { backgroundColor: colors.blue }]} />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function SectionLabel({ icon, label, badge, style }: { icon: React.ReactNode; label: string; badge?: string; style?: object }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      {icon}
      <Text style={styles.sectionLabelText}>{label}</Text>
      {badge && (
        <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>{badge}</Text></View>
      )}
      <View style={styles.sectionDivider} />
    </View>
  )
}

function OfflineRow({ emoji, title, meta, tint }: { emoji: string; title: string; meta: string; tint: string[] }) {
  return (
    <View style={styles.row}>
      <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </LinearGradient>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <View style={styles.rowCheck}>
        <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={14} color="#fff" strokeWidth={3} />
        </LinearGradient>
      </View>
    </View>
  )
}

function NeedsRow({ emoji, title, meta, tint }: { emoji: string; title: string; meta: string; tint: string[] }) {
  return (
    <View style={[styles.row, { opacity: 0.65 }]}>
      <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </LinearGradient>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.textMuted }]}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <View style={styles.waitingBadge}><Text style={styles.waitingBadgeText}>WAITING</Text></View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  brandBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  offlinePill: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dangerBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  offlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  offlineText: { fontSize: 10, fontWeight: '700', color: colors.danger },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 },
  illustrationWrap: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  ring1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: colors.blue },
  ring2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: colors.teal },
  disc: { width: 112, height: 112, borderRadius: 56, overflow: 'hidden', ...shadows.float },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 16, letterSpacing: -0.3 },
  sub: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18, maxWidth: 270 },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 20, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  retryInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  retryText: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },
  sectionLabelText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sectionBadge: { backgroundColor: colors.successBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  rowTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  rowMeta: { fontSize: 11, color: colors.textSubtle },
  rowCheck: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden' },
  waitingBadge: { backgroundColor: '#f0f2f5', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  waitingBadgeText: { fontSize: 9, fontWeight: '700', color: colors.textSubtle },
  waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  waitingText: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  waitingDot: { width: 6, height: 6, borderRadius: 3 },
})
