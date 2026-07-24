// @ts-nocheck
import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { RefreshCw } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { gradients } from '../theme'

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Top-level error boundary — catches runtime errors in any child screen and
 * shows a friendly "Something went wrong" screen instead of a white-screen
 * crash. The user can reload to reset the app state.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={gradients.primary as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.emoji}>😵‍💫</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected error. Try reloading — your data is safe.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack?.split('\n').slice(0, 6).join('\n')}
              </Text>
            </View>
          )}

          <Pressable onPress={this.handleReload} style={styles.buttonWrap}>
            <LinearGradient
              colors={['#ffffff', '#f5f7fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <RefreshCw size={16} color="#2e8bee" />
              <Text style={styles.buttonText}>Reload app</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2e8bee' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  errorBox: {
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    maxHeight: 200,
  },
  errorText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' },
  buttonWrap: { marginTop: 24 },
  button: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 32,
  },
  buttonText: { fontSize: 15, fontWeight: '800', color: '#2e8bee' },
})
