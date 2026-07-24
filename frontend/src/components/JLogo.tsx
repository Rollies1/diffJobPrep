// @ts-nocheck
import React from 'react'
import { View, ViewStyle } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { gradients } from '../theme'
import { Text } from 'react-native'

type Variant = 'tile' | 'light' | 'mono'

interface JLogoProps {
  size?: number
  variant?: Variant
  glow?: boolean
  style?: ViewStyle
}

export function JLogo({ size = 48, variant = 'tile', glow = true, style }: JLogoProps) {
  // Filled calligraphic J path (same as web): thick stem tapering to sharp tip.
  const jPath = 'M 39 12 L 39 26 C 39 34, 34 38, 25 38 C 16 38, 9 35, 7 29 C 10 32, 14 32, 19 32 C 25 32, 28 30, 28 26 L 28 12 Z'
  const gradientId = 'jp-j-grad'

  // Mono: just the gradient J, no container.
  if (variant === 'mono') {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={gradients.primary[0]} />
              <Stop offset="30%" stopColor={gradients.primary[1]} />
              <Stop offset="62%" stopColor={gradients.primary[3]} />
              <Stop offset="100%" stopColor={gradients.primary[5]} />
            </LinearGradient>
          </Defs>
          <Path d={jPath} fill={`url(#${gradientId})`} transform="skewX(-10) translate(4 0)" />
        </Svg>
      </View>
    )
  }

  const isLight = variant === 'light'
  const radius = size * 0.28
  const fillColor = isLight ? `url(#${gradientId})` : '#ffffff'

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: isLight ? '#ffffff' : undefined,
          alignItems: 'center',
          justifyContent: 'center',
          ...(isLight
            ? { shadowColor: '#142850', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }
            : glow
              ? { shadowColor: gradients.primary[0], shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 }
              : {}),
        },
        style,
      ]}
    >
      {!isLight && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            backgroundColor: 'transparent',
          }}
        >
          {/* Gradient tile background via a hidden Svg */}
          <Svg width={size} height={size} style={{ borderRadius: radius }}>
            <Defs>
              <LinearGradient id="jp-tile-bg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={gradients.primary[0]} />
                <Stop offset="30%" stopColor={gradients.primary[1]} />
                <Stop offset="62%" stopColor={gradients.primary[3]} />
                <Stop offset="100%" stopColor={gradients.primary[5]} />
              </LinearGradient>
            </Defs>
            <Path d={`M0,0 L${size},0 L${size},${size} L0,${size} Z`} fill="url(#jp-tile-bg)" />
          </Svg>
        </View>
      )}
      <Svg width={size} height={size} viewBox="0 0 48 48" style={{ position: 'relative' }}>
        {isLight && (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={gradients.primary[0]} />
              <Stop offset="30%" stopColor={gradients.primary[1]} />
              <Stop offset="62%" stopColor={gradients.primary[3]} />
              <Stop offset="100%" stopColor={gradients.primary[5]} />
            </LinearGradient>
          </Defs>
        )}
        <Path d={jPath} fill={fillColor} transform="skewX(-10) translate(4 0)" />
      </Svg>
    </View>
  )
}

/** Wordmark: small JLogo + "JobPrep" text. */
export function JWordmark({
  size = 22,
  tone = 'dark',
  style,
}: {
  size?: number
  tone?: 'dark' | 'light'
  style?: ViewStyle
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
      <JLogo size={size} variant="tile" glow={false} />
      <WordmarkText tone={tone} />
    </View>
  )
}

function WordmarkText({ tone }: { tone: 'dark' | 'light' }) {
  return (
    <Text
      style={{
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.3,
        color: tone === 'light' ? '#ffffff' : '#1a1d24',
      }}
    >
      Job
      <Text style={{ color: gradients.primary[1] }}>Prep</Text>
    </Text>
  )
}
