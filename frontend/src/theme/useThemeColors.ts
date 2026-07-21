/**
 * Reactive theme colors — light + dark palettes backed by the
 * useAppearanceStore (persisted via SecureStore). Screens that previously
 * imported the static `colors` object can call `useThemeColors()` instead
 * to get a palette that reacts to the user's light/dark preference.
 */
import { useAppearanceStore } from '../stores/useAppearanceStore'
import { colors as lightColors } from './index'

/** Dark-mode palette — mirrors the light colors structure 1:1. */
export const darkColors = {
  ...lightColors,
  ink: '#f4f6fa',
  text: '#f4f6fa',
  textMuted: '#a6adba',
  textSubtle: '#767e8d',
  bg: '#0e1117',
  surface: '#171b24',
  surfaceMuted: '#1e232e',
  border: '#262c38',
  divider: '#222834',
  successBg: 'rgba(15,157,111,0.16)',
  warningBg: 'rgba(217,119,6,0.16)',
  dangerBg: 'rgba(226,59,59,0.16)',
  infoBg: 'rgba(46,139,238,0.16)',
  // nav-specific
  navBg: 'rgba(20,24,32,0.92)',
  navInactiveBg: '#1e232e',
} as const

export type ThemeColors = typeof lightColors & {
  navBg: string
  navInactiveBg: string
}

/** Augment the light palette with the nav keys too. */
;(lightColors as any).navBg = 'rgba(255,255,255,0.92)'
;(lightColors as any).navInactiveBg = '#f5f7fa'

/** Hook returning the active color palette based on the stored preference. */
export function useThemeColors(): ThemeColors {
  const mode = useAppearanceStore((s) => s.mode)
  // 'system' falls back to light for now (React Native useColorScheme would
  // be wired here in a fuller implementation; the explicit light/dark toggle
  // is what the user controls from the profile screen).
  return mode === 'dark' ? (darkColors as ThemeColors) : (lightColors as ThemeColors)
}
