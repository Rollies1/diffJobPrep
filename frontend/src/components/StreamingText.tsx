import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

export function StreamingText({ text, active }: { text: string; active: boolean }) {
  return (
    <Text style={styles.text}>
      {text}
      {active && <Text style={styles.cursor}>▋</Text>}
    </Text>
  )
}

const styles = StyleSheet.create({
  text: { fontSize: 13, lineHeight: 18, color: colors.ink },
  cursor: {
    color: colors.blue,
    opacity: 0.7,
  },
})
