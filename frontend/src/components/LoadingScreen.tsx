import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing as REasing,
} from 'react-native-reanimated'
import { JLogo } from './JLogo'
import { gradients, colors } from '../theme'

/**
 * Branded splash / loading screen shown while the app hydrates auth state
 * and loads fonts. Uses the JobPrep JLogo with a breathing glow + a
 * three-dot loader underneath.
 */
export function LoadingScreen({ label = 'Getting things ready…' }: { label?: string }) {
  const breath = useSharedValue(1)

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.12, { duration: 1400, easing: REasing.inOut(REasing.ease) }),
      -1,
      true,
    )
  }, [breath])

  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
    opacity: 0.35 * breath.value,
  }))

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {/* Logo + breathing glow */}
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.glow, glow]} />
          <JLogo size={96} variant="light" glow />
        </View>

        <Text style={styles.title}>JobPrep</Text>
        <Text style={styles.subtitle}>Land your dream job, one answer at a time.</Text>

        {/* Three-dot loader */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Dot key={i} delay={i * 180} />
          ))}
        </View>

        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  )
}

function Dot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6)
  const opacity = useSharedValue(0.4)

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 600, easing: REasing.inOut(REasing.ease) }),
        -1,
        true,
      ),
    )
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 600, easing: REasing.inOut(REasing.ease) }),
        -1,
        true,
      ),
    )
  }, [delay, scale, opacity])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return <Animated.View style={[styles.dot, style]} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 36,
    height: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 14,
  },
})
