import React from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import PracticeDeckStartScreen from '../../../src/screens/PracticeDeckStartScreen'
import { useDecks } from '../../../src/hooks/queries'

export default function DeckStart() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>()
  const { data: decks } = useDecks()
  const deck = decks?.find((d) => d.id === deckId)

  if (!deck) return null

  return (
    <PracticeDeckStartScreen
      deck={deck}
      onBack={() => router.back()}
      onStart={(config) => {
        // Here you would start the session and redirect to /practice
        router.push('/(app)/practice')
      }}
    />
  )
}
