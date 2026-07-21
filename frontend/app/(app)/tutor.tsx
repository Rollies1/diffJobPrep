import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { JWordmark } from '../../src/components/JLogo'
import { BottomNav } from '../../src/components/BottomNav'
import { colors } from '../../src/theme'

export default function Tutor() {
  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <JWordmark size={22} tone="dark" />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48 }}>🤖</Text>
        <Text style={styles.title}>AI Tutor</Text>
        <Text style={styles.sub}>Coming next — port in progress</Text>
      </View>
      <BottomNav active="tutor" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 16 },
  sub: { fontSize: 13, color: colors.textSubtle, marginTop: 4 },
})
