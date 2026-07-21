Testing — JobPrep RN Frontend
The app has two test suites:

Unit tests (Jest) — test services, stores, and utilities in isolation
E2E tests (Maestro) — test full user flows on a simulator/emulator
Unit Tests (Jest)
Run
bash

# Run all unit tests
bun run test

# Watch mode (re-runs on file change)
bun run test:watch

# With coverage report
bun run test:coverage
What's tested
Test file
What it covers
__tests__/deepLinks.test.ts	parseDeepLink, buildDeepLink, requiresAuth — URL parsing, path params, query params, universal links, auth gating
__tests__/offlineQueue.test.ts	enqueue, getAll, remove, markFailed, prune, clear, count — the full offline queue lifecycle
__tests__/syncStore.test.ts	pendingCount, isSyncing, enqueue, clear, refreshCount — Zustand store state management

Configuration
jest.config.js — Jest preset (jest-expo), transform ignores, module aliases
jest.setup.ts — mocks for native modules (expo-linear-gradient, expo-secure-store, AsyncStorage, NetInfo, expo-notifications, expo-linking, expo-router)
Adding new unit tests
Create a file in __tests__/ named <moduleName>.test.ts
Import from ../src/...
Use describe + it + expect
typescript

import { parseDeepLink } from '../src/services/deepLinks'

describe('parseDeepLink', () => {
  it('parses a simple URL', () => {
    expect(parseDeepLink('jobprep://dashboard')).toEqual({
      route: '/(app)/dashboard',
      params: {},
    })
  })
})
E2E Tests (Maestro)
Maestro is the simplest E2E framework for React Native.
No native compilation needed — it uses accessibility labels and text to
interact with the app.

Prerequisites
bash

# Install Maestro
curl -Ls "https://get.maestro.mobile" | bash

# Start the app on a simulator/emulator
npx expo run:android
# or
npx expo run:ios
Run
bash

# Run all E2E flows
bun run test:e2e

# Run a specific flow
bun run test:e2e:login
bun run test:e2e:practice

# Or directly:
maestro test .maestro/01-login.yaml
Test flows
Flow
File
What it tests
Login	.maestro/01-login.yaml	Launch app → enter credentials → sign in → land on dashboard
Register	.maestro/02-register.yaml	Navigate to register → fill form → strength meter → submit
Dashboard → Library → Deck	.maestro/03-dashboard-library.yaml	Dashboard → Library tab → tap deck → deck detail → back
Practice loop	.maestro/04-practice-loop.yaml	Practice tab → start → answer → submit → next/see results
AI Tutor	.maestro/05-tutor.yaml	Tutor tab → type message → send → see streaming response
Navigation	.maestro/06-navigation.yaml	Cycle through all 5 tabs → Settings → back

Writing new E2E flows
Maestro flows are YAML files. Key commands:

yaml

appId: com.knust.jobprep
---
- launchApp:
    clearState: true      # fresh app state
- assertVisible: "Text"   # check text is on screen
- tapOn: "Button"         # tap by text
- tapOn:
    id: "element-id"      # tap by testID
- inputText: "value"      # type into focused field
- hideKeyboard            # dismiss keyboard
- extendedWaitUntil:      # wait for async content
    visible:
      text: "Result"
    timeout: 10000
Adding testIDs to components
For reliable element selection, add testID props:

tsx

<TextInput testID="email-input" ... />
<TextInput testID="password-input" ... />
<Pressable testID="send-button" ... />
The existing flows reference these testIDs. Add them to the screen components
if they're not already present.

CI Integration
GitHub Actions example
yaml

name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run test:coverage

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx expo run:ios
      - run: npm run test:e2e
Test Coverage
Run bun run test:coverage to generate a coverage report in coverage/.
Open coverage/lcov-report/index.html in a browser to see:

Per-file coverage percentages
Line-by-line coverage highlighting
Uncovered branches
Target: 80%+ coverage for src/services/ and src/store/.

Troubleshooting
Jest: "Cannot find module 'react-native-reanimated'"
Ensure jest.setup.ts mocks it. The mock is already in jest.setup.ts.

Maestro: "No device found"
Start a simulator first:

bash

# iOS
xcrun simctl boot "iPhone 15"
# Android
emulator -avd Pixel_7
Maestro: element not found
Check the text/id matches exactly (case-sensitive)
Add testID props to the component
Use extendedWaitUntil for async content
Run maestro test --debug for screenshots
