import React from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import QuestionDetailScreen from '../../../src/screens/QuestionDetailScreen'

export default function QuestionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <QuestionDetailScreen
      questionId={id}
      onBack={() => router.back()}
      onPractice={() => router.push('/(app)/practice')}
    />
  )
}
