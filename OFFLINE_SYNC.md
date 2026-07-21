Offline Sync Queue — Implementation & Protocol
The app supports offline-first practice: users can answer questions and
update question state while offline. Operations are persisted locally and
automatically synced to the backend when connectivity is restored.

Architecture
text

User action (offline)
  → offlineAware service checks NetInfo
  → enqueues SyncItem to AsyncStorage
  → updates useSyncStore.pendingCount
  → SyncIndicator shows "X pending"

Device comes back online (NetInfo listener)
  → SyncEngine.sync() fires
  → reads all pending items from offlineQueue
  → replays each against the backend:
      submit_answer   → POST /practice/sessions/{id}/answers
      complete_session → POST /practice/sessions/{id}/complete
      abandon_session → POST /practice/sessions/{id}/abandon
      question_state  → POST /questions/sync (batched)
  → removes successful items, retries failed ones (up to 5×)
  → invalidates React Query caches (stats, history, activity, decks)
  → SyncIndicator shows "Syncing…" → clears when done
Files
File
Purpose
src/services/offlineQueue.ts	AsyncStorage-backed queue: enqueue, getAll, remove, markFailed, prune, clear
src/store/useSyncStore.ts	Zustand store: pendingCount, isSyncing, lastSyncedAt, lastError
src/services/syncEngine.ts	Processes the queue on connectivity restore, retries failures, invalidates caches
src/services/offlineAware.ts	Wrappers that call the backend directly (online) or enqueue (offline)
src/components/SyncProvider.tsx	Starts the sync engine on app mount
src/components/SyncIndicator.tsx	UI pill showing "Syncing X items…" or "X pending · will sync when online"

Sync Item Types
typescript

type SyncItemType =
  | 'submit_answer'     // { sessionId, answerText, durationMs, confidence }
  | 'complete_session'  // { sessionId }
  | 'abandon_session'   // { sessionId }
  | 'question_state'    // { questionId, bookmarked?, completed?, rating?, notes? }
How It Works in Practice
1. User answers a question while offline
typescript

// In the practice route, instead of:
await practiceService.submitAnswer(sessionId, body)

// Use the offline-aware wrapper:
import { offlinePractice } from '../services/offlineAware'
const result = await offlinePractice.submitAnswer(sessionId, body)
// result.pending === true when queued, false when sent immediately
The wrapper checks NetInfo:

Online: calls the backend directly, returns the real response
Offline: enqueues a submit_answer item, returns { accepted: true, pending: true }
so the UI can proceed optimistically
2. User completes the session while offline
typescript

const { pending } = await offlinePractice.complete(sessionId)
if (pending) {
  // Show a "Results will sync when online" state instead of the live score
}
3. User bookmarks/notes a question while offline
typescript

import { offlineQuestions } from '../services/offlineAware'
await offlineQuestions.updateState({
  questionId: '123',
  bookmarked: true,
  notes: 'Remember to mention idempotency keys',
})
These are batched — multiple question-state changes are sent as a single
POST /questions/sync request when the engine runs.

4. Device reconnects
The SyncEngine (started by SyncProvider) listens to NetInfo. When
connectivity is restored, it:

Reads all pending items
Prunes items that have failed 5+ times
Processes session items sequentially (order matters)
Batches question-state items into a single sync call
Invalidates React Query caches so the UI refreshes
Updates useSyncStore.lastSyncedAt
Retry Strategy
Each item tracks attempts and lastError
Failed items are retried on the next sync cycle
After 5 failed attempts, the item is pruned (dropped)
The lastError is surfaced in the sync store for debugging
UI: SyncIndicator
Shows a pill at the top of the Dashboard:

Syncing: "Syncing 3 items…" with a spinner (gradient pill)
Offline + pending: "3 pending · will sync when online" (gray pill)
All synced: hidden (no indicator)
Backend Requirements
The backend already has the endpoints the sync engine calls:

POST /practice/sessions/{id}/answers — submit an answer
POST /practice/sessions/{id}/complete — complete a session
POST /practice/sessions/{id}/abandon — abandon a session
POST /questions/sync — batch sync question state (bookmarks/ratings/notes)
No new endpoints are needed. The sync engine replays existing operations.

POST /questions/sync request shape
json

{
  "changes": [
    {
      "questionId": "uuid-1",
      "bookmarked": true,
      "completed": false,
      "rating": null,
      "notes": null
    },
    {
      "questionId": "uuid-2",
      "bookmarked": false,
      "completed": true,
      "rating": 5,
      "notes": "Great explanation"
    }
  ]
}
Response:

json

{
  "applied": 2,
  "conflicts": []
}
If conflicts is non-empty, the backend detected conflicting changes
(e.g., the question was updated on another device). The frontend currently
ignores conflicts (server wins) — a future enhancement could show a
conflict-resolution UI.

Production Considerations
Storage: AsyncStorage is fine for typical queue sizes (<100 items).
For large offline datasets, upgrade to expo-sqlite or WatermelonDB.
Idempotency: The backend should be idempotent on session answers
(same answer submitted twice shouldn't double-count). Use a client-generated
idempotency key in the request.
Conflict resolution: Currently "last write wins" (server). For collaborative
features (shared decks), add a conflict detection + resolution flow.
Background sync: For true background sync, integrate with
expo-background-fetch or expo-task-manager to sync even when the app
is closed.
