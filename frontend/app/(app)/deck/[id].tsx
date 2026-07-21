import React from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import LibraryDeckScreen from '../../../src/screens/LibraryDeckScreen'
import type { QuestionDto } from '../../../src/types/api'

const CATEGORY_EMOJIS: Record<string, string> = {
  Algorithms: '🎯', Behavioral: '🧭', 'System Design': '🏗️',
  Frontend: '⚛️', Databases: '🗄️', 'AI/ML': '🤖',
}

export default function DeckDetail() {
  const params = useLocalSearchParams<{ id: string; title?: string; category?: string }>()

  return (
    <LibraryDeckScreen
      deckId={params.id}
      deckTitle={params.title ?? 'Deck'}
      deckCategory={params.category ?? 'Algorithms'}
      deckEmoji={CATEGORY_EMOJIS[params.category ?? ''] ?? '📚'}
      onBack={() => router.back()}
      onOpenQuestion={(q: QuestionDto) => router.push({ pathname: '/(app)/question/[id]', params: { id: q.id } })}
      onStartPractice={() => router.push({ pathname: '/(app)/practice/session', params: { deckId: params.id } })}
    />
  )
}
