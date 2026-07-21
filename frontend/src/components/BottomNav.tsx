import React from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Home, Library, Dumbbell, Bot, User } from 'lucide-react-native'
import { gradients, colors, shadows } from '../theme'

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
  return (
    <View style={styles.container}>
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
                  <Icon size={19} color="#fff" strokeWidth={2.4} />
                </LinearGradient>
              ) : (
                <View style={styles.inactiveIcon}>
                  <Icon size={19} color={colors.textSubtle} strokeWidth={2} />
                </View>
              )}
              <Text style={[styles.label, { color: isActive ? colors.ink : colors.textSubtle }]}>
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  tab: { alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  activeIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  inactiveIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '600' },
})
