import React from 'react'
import { router } from 'expo-router'
import SearchExploreScreen from '../../src/screens/SearchExploreScreen'

export default function SearchExplore() {
  return (
    <SearchExploreScreen
      onTab={(key) => {
        if (key === 'home') router.push('/(app)/dashboard')
        else if (key === 'library') router.push('/(app)/library')
        else if (key === 'practice') router.push('/(app)/practice')
        else if (key === 'tutor') router.push('/(app)/tutor')
        else if (key === 'profile') router.push('/(app)/profile')
      }}
    />
  )
}
