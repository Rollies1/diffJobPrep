# Question Service

The **Question Service** (`questionservice`) is the central repository for all educational content in CodeQuest. It manages decks, categories, and the questions themselves, and provides internal evaluation logic to determine whether a given answer is correct.

## Tech Stack
* **Java 21**
* **Spring Boot 3.5.x**
* **PostgreSQL**
* **Flyway** (Database migrations)
* **Testcontainers** (Isolated integration testing)

## Core Responsibilities
1. **Content Management:** CRUD operations for Decks, Categories, and Questions.
2. **Internal Grading:** Exposes protected, internal-only endpoints for evaluating whether a submitted answer matches the database's correct answer or acceptable alternatives.
3. **Content Distribution:** Serves paginated queries of questions to the `practiceservice` when a user starts a session or caches a deck for offline use.

## Key Endpoints

### Content APIs
* `GET /api/v1/questions/categories`
  * Lists available categories.
* `GET /api/v1/questions/decks/{deckId}/questions`
  * Retrieves all questions associated with a specific deck (used for offline caching and previewing).

### Internal APIs (Protected)
* `POST /api/v1/internal/questions/{id}/grade`
  * **Strictly for internal microservice use** (e.g., from `practiceservice`).
  * Accepts an answer payload and securely evaluates it against the hidden answer key, returning a boolean indicating correctness. This prevents clients from sniffing correct answers over the network during offline syncs.

## Setup & Running Locally

1. **Prerequisites:** JDK 21 installed.
2. **Database:** PostgreSQL instance running on `localhost:5432`.
3. **Run:**
   ```bash
   mvn spring-boot:run
   ```

## Testing
Comprehensive slice tests for repositories and unit tests for internal logic.
* **Testcontainers:** Docker Desktop must be running.

Run the test suite using:
```bash
mvn clean test
```
