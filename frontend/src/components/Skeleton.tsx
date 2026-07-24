// @ts-nocheck
import React, { useEffect } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useThemeColors } from '../theme/useThemeColors'

/**
 * Shimmering skeleton placeholder block. Use while data loads to prevent
 * layout shift — much better UX than a centered spinner.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | string
  height?: number | string
  radius?: number
  style?: ViewStyle
}) {
  const c = useThemeColors()
  const opacity = useSharedValue(0.4)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [opacity])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: c.surfaceMuted },
        animStyle,
        style,
      ]}
    />
  )
}

/** A 2×2 grid of stat-tile skeletons matching the dashboard layout. */
export function StatTileGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.tile}>
          <View style={styles.tileTop}>
            <Skeleton width={60} height={10} />
            <Skeleton width={28} height={28} radius={8} />
          </View>
          <Skeleton width={50} height={22} style={{ marginTop: 8 }} />
          <Skeleton width={70} height={10} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  )
}

/** A chart-shaped skeleton matching the weekly-activity card. */
export function ChartSkeleton() {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Skeleton width={40} height={28} />
        <Skeleton width={120} height={12} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 90, marginTop: 4 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ width: '100%', height: 60 + (i % 3) * 10, justifyContent: 'flex-end' }}>
              <Skeleton width="100%" height={40 + (i % 3) * 10} radius={8} />
            </View>
            <Skeleton width={10} height={8} />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 10 },
  tile: { width: '48%', borderRadius: 16, padding: 12 },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
