# Session Service

The **Session Service** is a core microservice in the CodeQuest ecosystem responsible for ingesting practice session data, calculating user experience points (XP), maintaining user streaks, and aggregating daily activity statistics. It serves as the primary analytics backend for a user's progression and activity history.

## Tech Stack
* **Java 21**
* **Spring Boot 3.2.x**
* **PostgreSQL**
* **Kafka** (Asynchronous event ingestion)
* **Flyway** (Database migrations)
* **Lombok**
* **Testcontainers** (Isolated integration testing)

## Core Responsibilities
1. **Session Ingestion:** Receives completed session payloads (either synchronously via internal REST APIs or asynchronously via Kafka) from the `practiceservice`.
2. **XP Calculation & Streaks:** Dynamically computes XP based on answering speed, accuracy, combo chains, and daily first-win bonuses. Tracks and calculates active multi-day practice streaks.
3. **User Statistics & Leaderboards:** Maintains persistent records of `UserLevel`, `DailyActivity`, and historical `CompletedSession` tables.
4. **Offline Sync Support:** Processes batched, chronologically ordered session payloads uploaded after a device comes back online, ensuring idempotent XP gains.

## Key Endpoints

### Internal Ingestion API (Protected)
* `POST /api/v1/sessions/internal/ingest`
  * Accepts a `SessionCompletedEvent` payload.
  * Idempotently saves the session, calculates XP, and updates the user's statistics.

### Client-Facing Analytics APIs
* `GET /api/v1/sessions/stats`
  * Returns the user's current level, total XP, current streak, and max streak.
* `GET /api/v1/sessions/history`
  * Paginated endpoint (using cursor-based pagination) to retrieve a user's past completed sessions.
* `GET /api/v1/sessions/activity`
  * Returns an activity graph (similar to a GitHub contribution graph) showing the user's practice consistency over a given number of days.

## Setup & Running Locally

1. **Prerequisites:** Ensure you have JDK 21 installed.
2. **Database:** The service expects a PostgreSQL instance running on `localhost:5432`.
3. **Kafka:** A local Kafka broker running on `localhost:9092` is required for asynchronous event processing.
4. **Run:**
   ```bash
   mvn spring-boot:run
   ```
   The service will start on port **8083**.

## Testing
The service contains an exhaustive test suite featuring **76+ passing tests** spanning unit testing for complex XP calculations to full-stack integration testing.
* **Testcontainers:** All integration tests automatically spin up a throwaway PostgreSQL 15 container. Docker Desktop must be running.

Run the test suite using:
```bash
mvn clean test
```
