# Practice Service

The **Practice Service** (`practiceservice`) is the engine driving user practice sessions in CodeQuest. It orchestrates serving questions to clients, collecting user answers, and facilitating offline-first functionality for a seamless learning experience even without a network connection.

## Tech Stack
* **Java 21**
* **Spring Boot 3.5.x**
* **PostgreSQL**
* **Kafka** (Asynchronous event broadcasting)
* **Testcontainers** (Isolated integration testing)

## Core Responsibilities
1. **Adaptive Question Selection:** Queries `questionservice` to select optimal questions for a user's practice session based on difficulty and previous history.
2. **Session State Management:** Tracks ongoing practice sessions, records user answers, and scores sessions upon completion.
3. **Offline-First Synchronization:** Accepts bulk payloads of practice sessions completed by a user while offline. It handles internal grading and ensures idempotency.
4. **Analytics Handoff:** Publishes completed session events via Kafka (or REST fallback) to the `sessionservice` for XP calculation and leaderboard tracking.

## Key Endpoints

### Practice Flow
* `POST /api/v1/practice/sessions/start`
  * Initiates a new practice session for a specified deck.
* `GET /api/v1/practice/sessions/{sessionId}/next`
  * Fetches the next question for an active session.
* `POST /api/v1/practice/sessions/{sessionId}/answer`
  * Submits an answer for a specific question in a session.
* `POST /api/v1/practice/sessions/{sessionId}/complete`
  * Finalizes a session and hands off the data to `sessionservice`.

### Offline Sync
* `POST /api/v1/practice/sync`
  * Accepts a batch of offline sessions. Verifies timestamps, idempotently processes them, queries the `questionservice` internal grading endpoint, and forwards the XP data securely to `sessionservice`.

## Setup & Running Locally

1. **Prerequisites:** JDK 21 installed.
2. **Database:** PostgreSQL instance running on `localhost:5432`.
3. **Kafka:** Local Kafka broker running on `localhost:9092`.
4. **Run:**
   ```bash
   mvn spring-boot:run
   ```

## Testing
Features a robust test suite covering complex concurrency and sync logic.
* **Testcontainers:** Docker Desktop must be running.

Run the test suite using:
```bash
mvn clean test
```
