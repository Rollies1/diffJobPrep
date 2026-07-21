/**
 * JobPrep theme — the brand palette + gradients, ported from the Next.js
 * design system. Use with StyleSheet.create().
 */
export const colors = {
  // Brand gradient stops
  blue: '#2e8bee',
  teal: '#18b6c5',
  tealGreen: '#2bbfae',
  gold: '#f2c94c',
  amber: '#f59e0b',
  orange: '#fb7b3a',

  // Neutrals
  ink: '#1a1d24',
  text: '#1a1d24',
  textMuted: '#6b7280',
  textSubtle: '#9aa1ab',
  bg: '#fbfcfe',
  surface: '#ffffff',
  surfaceMuted: '#f5f7fa',
  border: '#eef1f5',
  divider: '#f0f2f5',

  // Semantic
  success: '#0f9d6f',
  successBg: '#e7f7f0',
  warning: '#d97706',
  warningBg: '#fef3e2',
  danger: '#e23b3b',
  dangerBg: '#fdeaea',
  info: '#2e8bee',
  infoBg: '#eef4ff',
}

export const gradients = {
  /** Core: blue → teal → gold → amber → orange */
  primary: [colors.blue, colors.teal, colors.tealGreen, colors.gold, colors.amber, colors.orange],
  blueTeal: [colors.blue, colors.teal],
  warm: [colors.gold, colors.amber, colors.orange],
} as const

export const fontFamilies = {
  // Replace with your actual loaded fonts (e.g. Geist, Inter).
  // These keys mirror the Next.js --font-geist-sans defaults.
  sans: undefined,
  mono: undefined,
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const

export const shadows = {
  card: {
    shadowColor: '#142850',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  soft: {
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  float: {
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 8,
  },
} as const
