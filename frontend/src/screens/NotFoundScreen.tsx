import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Home, Compass, ChevronRight } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { GradientButton } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

const STARS = [
  { x: 12, y: 18, s: 2, o: 0.9 }, { x: 78, y: 22, s: 3, o: 0.7 }, { x: 30, y: 70, s: 2, o: 0.8 },
  { x: 88, y: 65, s: 2, o: 0.6 }, { x: 60, y: 15, s: 1.5, o: 0.9 }, { x: 20, y: 45, s: 1.5, o: 0.5 },
  { x: 70, y: 80, s: 2.5, o: 0.7 }, { x: 45, y: 35, s: 1.5, o: 0.6 }, { x: 92, y: 40, s: 2, o: 0.8 },
  { x: 8, y: 80, s: 2, o: 0.7 },
]

export default function NotFoundScreen({ onHome }: { onHome?: () => void }) {
  return (
    <View style={styles.container}>
      {/* Brand mark */}
      <View style={styles.brandWrap}><JWordmark size={22} tone="light" /></View>

      {/* Starfield + nebula */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.nebula1} />
        <View style={styles.nebula2} />
        {STARS.map((s, i) => (
          <View key={i} style={[styles.star, { left: `${s.x}%` as any, top: `${s.y}%` as any, width: s.s, height: s.s, opacity: s.o }]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.astronaut}>🧑🚀</Text>
        <Text style={styles.errorCode}>404</Text>
        <Text style={styles.title}>Lost in Space</Text>
        <Text style={styles.sub}>The page you're looking for drifted off into orbit. Let's get you back to mission control.</Text>

        <View style={styles.actions}>
          <Pressable onPress={onHome}>
            <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Home size={16} color="#fff" />
              <Text style={styles.ctaText}>Back to dashboard</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.secondaryBtn}>
            <Compass size={16} color="#fff" />
            <Text style={styles.secondaryText}>Explore the library</Text>
            <ChevronRight size={16} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.footer}>Error code: JP-404 · signal lost</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1020', alignItems: 'center', justifyContent: 'center' },
  brandWrap: { position: 'absolute', top: 32, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  nebula1: { position: 'absolute', left: '30%', top: '30%', width: 288, height: 288, borderRadius: 144, backgroundColor: colors.blue, opacity: 0.3 },
  nebula2: { position: 'absolute', right: 0, top: 40, width: 224, height: 224, borderRadius: 112, backgroundColor: colors.orange, opacity: 0.25 },
  star: { position: 'absolute', borderRadius: 2, backgroundColor: '#fff' },
  content: { alignItems: 'center', paddingHorizontal: 32, zIndex: 10 },
  astronaut: { fontSize: 72 },
  errorCode: { fontSize: 56, fontWeight: '800', color: colors.blue, marginTop: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 8 },
  sub: { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: 8, lineHeight: 18, maxWidth: 240 },
  actions: { width: '100%', maxWidth: 240, gap: 10, marginTop: 24 },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  secondaryBtn: { height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  secondaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  footer: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 24 },
})
