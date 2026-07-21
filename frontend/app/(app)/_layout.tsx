import React from 'react'
import { Tabs } from 'expo-router'
import { BottomNav } from '../../src/components/BottomNav'
import { BreathingGradient } from '../../src/components/backgrounds/BreathingGradient'

/**
 * Tab-based layout for the authenticated app.
 *
 * Using expo-router <Tabs> (not <Stack>) gives native tab-bar behaviour:
 *   • tap any tab from any other tab — no "go home first" requirement
 *   • each tab keeps its own navigation stack, so hardware back returns to
 *     the previous screen WITHIN the current tab, and switching tabs is
 *     instant (screens stay mounted).
 *
 * The shared <BottomNav> is rendered as the custom tab bar so the visual
 * style stays consistent with the existing design.
 */
export default function AppLayout() {
  return (
    <BreathingGradient intensity="subtle">
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
        tabBar={(props) => <BottomNav {...tabBarAdapter(props)} />}
      >
        <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
        <Tabs.Screen name="library" options={{ title: 'Library' }} />
        <Tabs.Screen name="practice" options={{ title: 'Practice' }} />
        <Tabs.Screen name="tutor" options={{ title: 'Tutor' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        {/* nested routes — hidden from the tab bar */}
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="achievements" options={{ href: null }} />
        <Tabs.Screen name="leaderboard" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="study-plan" options={{ href: null }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="deck-create" options={{ href: null }} />
        <Tabs.Screen name="deck-start/[deckId]" options={{ href: null }} />
        <Tabs.Screen name="deck/[id]" options={{ href: null }} />
        <Tabs.Screen name="question/[id]" options={{ href: null }} />
        <Tabs.Screen name="mock-report" options={{ href: null }} />
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen name="not-found" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="admin/metrics" options={{ href: null }} />
      </Tabs>
    </BreathingGradient>
  )
}

/** Adapt expo-router's tab-bar props to the simple { active, onTab } BottomNav. */
function tabBarAdapter(props: any) {
  const route = props.state.routes[props.state.index]
  // expo-router route names for the 5 tabs — map to BottomNav keys.
  const nameMap: Record<string, string> = {
    dashboard: 'home',
    library: 'library',
    practice: 'practice',
    tutor: 'tutor',
    profile: 'profile',
  }
  return {
    active: nameMap[route?.name] ?? 'home',
    onTab: (key: string) => {
      const targetMap: Record<string, string> = {
        home: 'dashboard',
        library: 'library',
        practice: 'practice',
        tutor: 'tutor',
        profile: 'profile',
      }
      const target = targetMap[key]
      if (target) props.navigation.navigate(target)
    },
  }
}
