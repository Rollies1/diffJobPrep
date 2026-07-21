/**
 * Jest setup — runs before each test file.
 * Mocks native modules that aren't available in the test environment.
 */
import '@testing-library/jest-native/extend-expect'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
)

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    LinearGradient: (props: any) => React.createElement(View, { ...props, testID: 'gradient' }),
  }
})

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailable: () => true,
}))

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: jest.fn(() => () => {}),
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  },
  useNetInfo: () => ({ isConnected: true, isInternetReachable: true }),
}))

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[mock]' })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}))

// Mock expo-linking
jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  parse: jest.fn((url: string) => ({ url, path: url.replace('jobprep://', '') })),
}))

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: {
    Screen: () => null,
  },
}))

// Silence console.warn in tests
const originalWarn = console.warn
console.warn = (...args) => {
  if (args[0]?.includes?.('Animated')) return
  originalWarn(...args)
}
