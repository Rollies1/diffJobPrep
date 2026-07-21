# CodeQuest Frontend (Mobile Application)

The **CodeQuest Frontend** is a cross-platform mobile application built using React Native and Expo. It provides a seamless, highly responsive user interface for students to practice coding interview questions, track their progress, and interact with the AI-driven features of the CodeQuest ecosystem.

Crucially, the app features an **Offline-First Architecture**, allowing students to continue practicing and learning even when commuting or in areas with poor network connectivity.

## Tech Stack
* **Framework:** React Native & Expo (v51)
* **Language:** TypeScript
* **State Management:** Zustand & React Query
* **Styling:** NativeWind (Tailwind CSS for React Native)
* **Local Storage (Offline):** Expo SQLite
* **Network Detection:** `@react-native-community/netinfo`
* **E2E Testing:** Maestro

## Core Features & Offline Architecture

1. **Offline-First Practice Sessions:**
   - **Local SQLite Caching:** Uses `expo-sqlite` to cache practice decks, questions, and user statistics locally.
   - **Session Queuing:** When a user completes a practice session while offline, the payload is securely saved locally with a `SYNC_QUEUED` state.
   - **Background Synchronization:** A dedicated Sync Worker (`useSyncEngine.ts`) monitors the network state. Once connectivity is restored, it batched-uploads all queued offline sessions to the `practiceservice`, ensuring no data is lost.
   - **Idempotency:** The sync payloads are strictly serialized via Zod (`SyncPayloadSchema`) and handled idempotently by the backend to prevent duplicate XP accumulation.

2. **Authentication:**
   - Secure token storage using `expo-secure-store`.
   - Interacts with the `authservice` to obtain and refresh JWTs.

3. **Analytics Dashboard:**
   - Displays real-time and locally-cached XP, streaks, and GitHub-style daily activity charts by polling the `sessionservice` (and falling back to SQLite when offline).

## Setup & Running Locally

### Prerequisites
* Node.js (v18+)
* Yarn or npm
* Expo CLI (`npm install -g expo-cli`)
* iOS Simulator (Xcode) or Android Emulator (Android Studio)

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the Expo development server:
```bash
npm start
```
From the Expo CLI, press:
* `i` to open in the iOS Simulator.
* `a` to open in the Android Emulator.

## API Integration & Codegen
The app communicates with the local backend microservices (typically exposed via a Gateway or directly on `localhost`).
We utilize OpenAPI schema generation to maintain strict type safety between the backend and frontend:
```bash
npm run types:generate
```

## Testing

### End-to-End (E2E) Testing
The frontend utilizes [Maestro](https://maestro.mobile.dev/) for robust UI and E2E testing flows.
To run the E2E tests:
```bash
npm run test:e2e
```
Or for specific flows:
```bash
npm run test:e2e:practice
```
