import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { JWordmark } from '../../src/components/JLogo'
import { useThemeColors } from '../../src/theme/useThemeColors'

export default function Tutor() {
  const c = useThemeColors()
  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <JWordmark size={22} tone="dark" />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48 }}>🤖</Text>
        <Text style={[styles.title, { color: c.ink }]}>AI Tutor</Text>
        <Text style={[styles.sub, { color: c.textSubtle }]}>Coming next — port in progress</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 16 },
  sub: { fontSize: 13, marginTop: 4 },
})
