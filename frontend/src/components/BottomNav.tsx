import React from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Home, Library, Dumbbell, Bot, User } from 'lucide-react-native'
import { gradients, shadows } from '../theme'
import { useThemeColors } from '../theme/useThemeColors'

const TABS = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'library', label: 'Library', Icon: Library },
  { key: 'practice', label: 'Practice', Icon: Dumbbell },
  { key: 'tutor', label: 'Tutor', Icon: Bot },
  { key: 'profile', label: 'Profile', Icon: User },
] as const

export function BottomNav({
  active = 'home',
  onTab,
}: {
  active?: string
  onTab?: (key: string) => void
}) {
  const c = useThemeColors()
  return (
    <View style={[styles.container, { backgroundColor: c.navBg, borderTopColor: c.border }]}>
      <View style={styles.row}>
        {TABS.map((t) => {
          const isActive = t.key === active
          const Icon = t.Icon
          return (
            <Pressable
              key={t.key}
              onPress={() => onTab?.(t.key)}
              style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.8 : 1 }]}
            >
              {isActive ? (
                <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activeIcon}>
                  <Icon size={20} color="#fff" strokeWidth={2.4} />
                </LinearGradient>
              ) : (
                <View style={[styles.inactiveIcon, { backgroundColor: c.navInactiveBg }]}>
                  <Icon size={20} color={c.textSubtle} strokeWidth={2} />
                </View>
              )}
              <Text style={[styles.label, { color: isActive ? c.ink : c.textSubtle, fontWeight: isActive ? '700' : '500' }]}>
                {t.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tab: { alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, paddingVertical: 6 },
  activeIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  inactiveIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
})
