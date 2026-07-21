import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { JWordmark } from '../../src/components/JLogo'
import { BottomNav } from '../../src/components/BottomNav'
import { useLogout } from '../../src/hooks/queries'
import { colors } from '../../src/theme'

export default function Profile() {
  const logout = useLogout()
  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <JWordmark size={22} tone="dark" />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48 }}>👤</Text>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.sub}>Coming next — port in progress</Text>
        <Pressable
          style={styles.logoutBtn}
          onPress={() => { logout.mutate(); router.replace('/(auth)/login') }}
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>
      <BottomNav active="profile" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 16 },
  sub: { fontSize: 13, color: colors.textSubtle, marginTop: 4 },
  logoutBtn: { marginTop: 24, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.dangerBg },
  logoutText: { fontSize: 13, fontWeight: '700', color: colors.danger },
})
