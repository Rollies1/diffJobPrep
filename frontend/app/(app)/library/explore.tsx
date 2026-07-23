import React from 'react'
import { router } from 'expo-router'
import LibraryIndexScreen from '../../../src/screens/LibraryIndexScreen'
import type { DeckDto } from '../../../src/types/api'

/**
 * Explore — the visual "story-ring + grid" library browser (LibraryIndexScreen).
 *
 * This is a sibling of the functional library/index. Tapping a deck opens the
 * deck detail route so the rest of the flow (start practice / open question)
 * stays unchanged.
 */
export default function LibraryExplore() {
  const onOpenDeck = (deck: DeckDto) => {
    router.push({
      pathname: '/(app)/deck/[id]',
      params: { id: deck.id, title: deck.title, category: deck.category, color: deck.color },
    })
  }

  const onTab = (key: string) => {
    if (key === 'library') return
    const map: Record<string, string> = {
      home: '/(app)/dashboard',
      practice: '/(app)/practice',
      tutor: '/(app)/tutor',
      profile: '/(app)/profile',
    }
    if (map[key]) router.push(map[key])
  }

  return <LibraryIndexScreen onOpenDeck={onOpenDeck} onTab={onTab} />
}
