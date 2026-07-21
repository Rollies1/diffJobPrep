JobPrep — React Native Frontend
A cross-platform mobile app for interview preparation, built with React Native + Expo + TypeScript. Connects to a Java Spring Boot microservices backend (PostgreSQL).

Quick Start
bash

# 1. Install dependencies
npx expo install

# 2. Add NetInfo (for offline detection)
npx expo install @react-native-community/netinfo

# 3. Start the dev server
npx expo start

# Press 'a' for Android emulator, 'i' for iOS simulator, or scan QR with Expo Go
Backend Setup
The app expects the Spring Boot gateway running at:

Platform
URL
Android emulator	http://10.0.2.2:8089/api/v1
iOS simulator	http://localhost:8089/api/v1

Update in src/services/api.ts if your port differs.

Architecture
text

app/                          expo-router (file-based routing)
  _layout.tsx                 Root: QueryClient + OfflineDetector + auth gate
  (auth)/                     Unauthenticated group
    login.tsx
    register.tsx
  (app)/                      Authenticated group (20 routes)
    dashboard.tsx             ← Home (useStats + useActivity + useHistory)
    library.tsx               ← Deck list (useDecks)
    deck/[id].tsx             ← Deck detail (useDeckQuestions)
    deck-start/[deckId].tsx   ← Per-deck config before practice
    deck-create.tsx           ← Multi-step deck builder
    question/[id].tsx         ← Question detail (useQuestion)
    practice.tsx              ← Practice loop controller (setup→session→results)
    tutor.tsx                 ← AI Tutor chat (useEvaluate)
    profile.tsx               ← Profile (useAuthStore + useStats)
    settings.tsx              ← Settings with toggles
    achievements.tsx          ← Trophy room (useStats)
    notifications.tsx         ← Activity feed
    leaderboard.tsx           ← Rankings + podium
    study-plan.tsx            ← Heatmap calendar (useActivity)
    search.tsx                ← Search & explore (useDecks)
    mock-report.tsx           ← Post-mock report
    admin.tsx                 ← Admin metrics
    not-found.tsx             ← 404

src/
  types/api.ts                ← All TypeScript types (mirror of Java DTOs)
  services/
    api.ts                    ← Axios instance (gateway URL + JWT refresh on 401)
    storage.ts                ← Secure token storage (expo-secure-store)
    auth.ts                   ← /auth service
    questions.ts              ← /questions service
    practice.ts               ← /practice service
    stats.ts                  ← /sessions service
    ai.ts                     ← /ai service
  store/useAuthStore.ts       ← Zustand auth store
  hooks/queries.ts            ← All React Query hooks
  theme/index.ts              ← Brand colors, gradients, shadows
  components/
    JLogo.tsx                 ← Calligraphic "J" brand mark (react-native-svg)
    primitives.tsx            ← Avatar, GradientButton, ProgressRing, Chip, etc.
    BottomNav.tsx             ← Tab bar
    OfflineDetector.tsx       ← NetInfo wrapper → shows OfflineScreen
    styles.ts                 ← Shared StyleSheet
  screens/                    ← 25 screen components
Backend API Contract
Service
Base
Auth
Key Endpoints
Auth	/auth	—	register, login, me, refresh, logout
Questions	/questions	public reads	decks, decks/{id}/questions (cursor), {id}, categories, sync
Practice	/practice	JWT	sessions, sessions/{id}/answers, /next, /complete, /abandon
Sessions	/sessions	JWT	stats, history (cursor), activity?days=7
AI	/ai	JWT	evaluate, cv/generate

Auth flow: Login → AuthResponse { user, accessToken, refreshToken } → stored in secure storage → Axios interceptor attaches Authorization: Bearer → gateway validates JWT and injects X-User-Id downstream.

Practice loop: POST /practice/sessions → POST /sessions/{id}/answers → POST /sessions/{id}/next → POST /sessions/{id}/complete → SessionResult { score, correctAnswers, skillBreakdown }.

Key Features
22+ screens ported from the Next.js design spec
Full practice loop wired end-to-end: setup → active session (auto-graded) → completion (real score + skill breakdown + XP)
AI Tutor that evaluates answers via /ai/evaluate (strengths, weaknesses, score)
Offline detection via NetInfo — shows a beautiful offline screen when connectivity drops
JWT auth with automatic token refresh on 401 (request queue during refresh)
Cursor pagination for deck questions and session history (infinite scroll)
Secure storage for tokens (expo-secure-store with AsyncStorage fallback)
Design system: calligraphic "J" logo, brand gradient (blue→teal→gold→amber→orange), glassmorphism, Reanimated animations
Dependencies
{
  "expo": "~51.0.0",
  "expo-router": "~3.5.0",
  "expo-linear-gradient": "~13.0.2",
  "expo-secure-store": "~13.0.1",
  "react-native": "0.74.2",
  "react-native-svg": "15.2.0",
  "react-native-reanimated": "~3.10.1",
  "react-native-screens": "3.31.1",
  "react-native-safe-area-context": "4.10.1",
  "@react-native-async-storage/async-storage": "^1.23.0",
  "@react-native-community/netinfo": "11.3.1"
}
