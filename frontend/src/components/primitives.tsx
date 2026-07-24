import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native'
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated'
import { colors, gradients, shadows } from '../theme'
import { useThemeColors } from '../theme/useThemeColors'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'

/* ── GradientBackground ──────────────────────────────────────── */

export function GradientBackground({
  variant = 'primary',
  style,
  children,
}: {
  variant?: 'primary' | 'warm' | 'blueTeal'
  style?: ViewStyle
  children?: React.ReactNode
}) {
  const stops =
    variant === 'warm' ? gradients.warm : variant === 'blueTeal' ? gradients.blueTeal : gradients.primary
  return (
    <ExpoLinearGradient colors={stops as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ flex: 1 }, style]}>
      {children}
    </ExpoLinearGradient>
  )
}

/* ── BreathingGradient — subtle pulsating blobs ──────────────── */

export function BreathingGradient() {
  const blob1 = useSharedValue(1)
  const blob2 = useSharedValue(1)
  const blob3 = useSharedValue(1)

  useEffect(() => {
    blob1.value = withRepeat(withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true)
    blob2.value = withRepeat(withTiming(1.06, { duration: 3500, easing: Easing.inOut(Easing.ease) }), -1, true)
    blob3.value = withRepeat(withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [])

  const s1 = useAnimatedStyle(() => ({ transform: [{ scale: blob1.value }], opacity: 0.25 }))
  const s2 = useAnimatedStyle(() => ({ transform: [{ scale: blob2.value }], opacity: 0.2 }))
  const s3 = useAnimatedStyle(() => ({ transform: [{ scale: blob3.value }], opacity: 0.15 }))

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[{ position: 'absolute', left: -60, top: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.blue }, s1]}
      />
      <Animated.View
        style={[{ position: 'absolute', right: -40, top: 120, width: 210, height: 210, borderRadius: 105, backgroundColor: colors.orange }, s2]}
      />
      <Animated.View
        style={[{ position: 'absolute', bottom: -40, left: 60, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.teal }, s3]}
      />
    </View>
  )
}

/* ── ProgressRing ────────────────────────────────────────────── */

export function ProgressRing({
  progress,
  size = 56,
  stroke = 6,
  trackColor = 'rgba(46,139,238,0.14)',
  children,
  style,
}: {
  progress: number
  size?: number
  stroke?: number
  trackColor?: string
  children?: React.ReactNode
  style?: ViewStyle
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, progress))
  const offset = c - (clamped / 100) * c
  const gid = `pr-${size}-${Math.round(clamped)}`

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.blue} />
            <Stop offset="35%" stopColor={colors.teal} />
            <Stop offset="65%" stopColor={colors.gold} />
            <Stop offset="100%" stopColor={colors.orange} />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  )
}

/* ── Avatar ──────────────────────────────────────────────────── */

export function Avatar({
  name,
  size = 40,
  ring = false,
  style,
}: {
  name: string
  size?: number
  ring?: boolean
  style?: ViewStyle
}) {
  const initials = name.trim().charAt(0).toUpperCase() || '?'
  if (ring) {
    return (
      <View style={[{ padding: 2, borderRadius: size, overflow: 'hidden' }, style]}>
        <ExpoLinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: size, padding: 2 }}>
          <View style={{ borderRadius: size, backgroundColor: '#fff', padding: 2 }}>
            <AvatarInner initials={initials} size={size - 8} />
          </View>
        </ExpoLinearGradient>
      </View>
    )
  }
  return <AvatarInner initials={initials} size={size} style={style} />
}

function AvatarInner({ initials, size, style }: { initials: string; size: number; style?: ViewStyle }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size, overflow: 'hidden' }, style]}>
      <ExpoLinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '800' }}>{initials}</Text>
      </ExpoLinearGradient>
    </View>
  )
}

/* ── GradientButton ──────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'warm' | 'blue' | 'outline' | 'ghost'

export function GradientButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled,
}: {
  children: React.ReactNode
  onPress?: () => void
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
  textStyle?: TextStyle
  disabled?: boolean
}) {
  const stops =
    variant === 'warm' ? gradients.warm : variant === 'blue' ? gradients.blueTeal : gradients.primary

  const heights = { sm: 36, md: 44, lg: 52 }
  const fontSizes = { sm: 13, md: 14, lg: 15 }
  const h = heights[size]

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            height: h,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            backgroundColor: variant === 'ghost' ? 'rgba(0,0,0,0.05)' : '#fff',
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: 'rgba(0,0,0,0.05)',
            opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
            ...shadows.card,
          },
          style,
        ]}
      >
        <Text style={{ fontSize: fontSizes[size], fontWeight: '700', color: colors.ink, ...textStyle }}>
          {children}
        </Text>
      </Pressable>
    )
  }

  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }, style]}>
      <ExpoLinearGradient
        colors={stops as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: h,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          ...shadows.soft,
        }}
      >
        <Text style={{ fontSize: fontSizes[size], fontWeight: '800', color: '#fff', ...textStyle }}>
          {children}
        </Text>
      </ExpoLinearGradient>
    </Pressable>
  )
}

/* ── Chip ────────────────────────────────────────────────────── */

export function Chip({
  children,
  active = false,
  onPress,
  style,
}: {
  children: React.ReactNode
  active?: boolean
  onPress?: () => void
  style?: ViewStyle
}) {
  const c = useThemeColors()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          opacity: pressed ? 0.9 : 1,
        },
        active
          ? { ...shadows.soft }
          : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
        style,
      ]}
    >
      {active && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, overflow: 'hidden' }}>
          <ExpoLinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        </View>
      )}
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : c.textMuted, position: 'relative' }}>
        {children}
      </Text>
    </Pressable>
  )
}

/* ── SectionTitle ────────────────────────────────────────────── */

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  const c = useThemeColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: c.ink }}>{title}</Text>
      {action}
    </View>
  )
}

/* ── StatTile ────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  sub,
  accent = 'blue',
  icon,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'blue' | 'teal' | 'gold' | 'orange' | 'rose' | 'violet'
  icon?: React.ReactNode
}) {
  const c = useThemeColors()
  const tints: Record<string, string[]> = {
    blue: [colors.blue, colors.teal],
    teal: [colors.teal, colors.tealGreen],
    gold: [colors.gold, colors.amber],
    orange: [colors.amber, colors.orange],
    rose: [colors.orange, '#f43f5e'],
    violet: [colors.blue, '#8b5cf6'],
  }
  return (
    <View style={[styles.card, { padding: 12, backgroundColor: c.surface }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: c.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
        {icon && (
          <View style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden' }}>
            <ExpoLinearGradient colors={tints[accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </ExpoLinearGradient>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: c.ink, marginTop: 4 }}>{value}</Text>
      {sub && <Text style={{ fontSize: 11, fontWeight: '500', color: c.teal, marginTop: 4 }}>{sub}</Text>}
    </View>
  )
}

/* ── DifficultyBadge ─────────────────────────────────────────── */

export function DifficultyBadge({ level }: { level: 'Easy' | 'Medium' | 'Hard' }) {
  const c = useThemeColors()
  const map = {
    Easy: { bg: c.successBg, text: c.success },
    Medium: { bg: c.warningBg, text: c.warning },
    Hard: { bg: c.dangerBg, text: c.danger },
  }
  const s = map[level]
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: s.text }}>{level}</Text>
    </View>
  )
}

/* ── PremiumBadge ────────────────────────────────────────────── */

export function PremiumBadge({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' }, style]}>
      <ExpoLinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', position: 'relative' }}>★ PREMIUM</Text>
    </View>
  )
}

/* ── StreakFlame ─────────────────────────────────────────────── */

export function StreakFlame({ days = 7 }: { days?: number }) {
  const c = useThemeColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden' }}>
        <ExpoLinearGradient colors={[colors.gold, colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14 }}>🔥</Text>
        </ExpoLinearGradient>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: c.ink }}>{days}</Text>
    </View>
  )
}

/* ── ScreenHeader ────────────────────────────────────────────── */

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: React.ReactNode
}) {
  const c = useThemeColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 }}>
      {onBack && (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            ...shadows.card,
          })}
        >
          <Text style={{ fontSize: 20, color: c.ink }}>‹</Text>
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: c.ink }} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: c.textMuted }} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  )
}

/* ── MiniBarChart ────────────────────────────────────────────── */

export function MiniBarChart({
  data,
  height = 90,
}: {
  data: { label: string; value: number; highlight?: boolean }[]
  height?: number
}) {
  const c = useThemeColors()
  const max = Math.max(...data.map((d) => d.value), 1)
  const labelH = 18
  const chartH = height - labelH - 6
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <View style={{ width: '100%', height: chartH, justifyContent: 'flex-end' }}>
            <View
              style={{
                width: '100%',
                height: Math.max(6, (d.value / max) * chartH),
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                backgroundColor: d.highlight ? undefined : c.divider,
                overflow: 'hidden',
              }}
            >
              {d.highlight && (
                <ExpoLinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }} />
              )}
            </View>
          </View>
          <Text style={{ fontSize: 10, fontWeight: '600', color: c.textSubtle }}>{d.label}</Text>
        </View>
      ))}
    </View>
  )
}

/* ── StoryRing ───────────────────────────────────────────────── */

export function StoryRing({ children, size = 64, seen = false }: { children: React.ReactNode; size?: number; seen?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size, padding: 2.5, backgroundColor: seen ? '#e3e7ee' : undefined, overflow: 'hidden' }}>
      {!seen && (
        <ExpoLinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: size }} />
      )}
      <View style={{ flex: 1, borderRadius: size, backgroundColor: '#fff', padding: 2 }}>{children}</View>
    </View>
  )
}

/* ── Shared styles ───────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    ...shadows.card,
  },
})

export { styles }
