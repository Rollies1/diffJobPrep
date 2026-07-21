# CodeQuest Ecosystem

Welcome to the **CodeQuest Ecosystem**, an advanced, microservice-based application designed to help users prepare for technical interviews and coding challenges. CodeQuest offers an intelligent, offline-capable practice environment powered by AI and asynchronous event-driven architecture.

## Overview

The backend is composed of five distinct Spring Boot microservices, each built with Java 21 and Spring Boot 3.5.x, communicating via REST and Apache Kafka, and independently persisting data using PostgreSQL. 

The frontend uses an offline-first architecture powered by SQLite and PWA mechanics, ensuring that students can continue their learning even without an active internet connection.

### Microservices

1. **[Auth Service](./authservice/authservice/README.md)**
   - Manages user identity, registration, and stateless JWT token issuance.
2. **[Practice Service](./practiceservice/practiceservice/README.md)**
   - Orchestrates practice sessions, caches offline state, and handles the batch ingestion of completed offline practices.
3. **[Question Service](./questionservice/questionservice/README.md)**
   - The central repository for decks, categories, and questions. Performs highly-secured internal evaluations of user answers.
4. **[Session Service](./sessionservice/README.md)**
   - Analytics powerhouse. Tracks XP, streaks, levels, and user history via asynchronous Kafka events and internal REST triggers.
5. **[AI Service](./aiservice/aiservice/README.md)**
   - Integrates multiple LLM providers (Groq, Gemini, OpenRouter, Qwen) with automatic failover to evaluate open-ended questions and generate dynamic interview prompts from uploaded CVs.

## Architecture Highlights

* **Offline-First Synchronization:** The frontend leverages a custom SQLite sync engine. When a device drops offline, practice sessions are stored locally. Upon reconnection, the frontend sync worker batched-uploads them to the `practiceservice`. The `practiceservice` delegates answer checking to `questionservice`, computes an authoritative score, and passes the result to `sessionservice` for idempotent XP calculation.
* **Resilient AI Pipeline:** The `aiservice` ensures high availability of AI evaluations by automatically failing over across multiple LLM providers if rate limits or outages are encountered.
* **Idempotency:** Core endpoints are designed to be fully idempotent, preventing double-XP glitches if a client reconnects and accidentally resends an offline sync payload.

## Prerequisites & Infrastructure Setup

To run the full stack locally, you must have the following dependencies installed:
1. **JDK 21**
2. **Maven 3.8+**
3. **Docker Desktop** (required for `Testcontainers` execution)
4. **Apache Kafka** (running on `localhost:9092`)
5. **PostgreSQL** (running on `localhost:5432`)

### Running the Services

Each service is a self-contained Spring Boot application. Navigate to any service directory and use Maven to run it:

```bash
cd authservice/authservice
mvn spring-boot:run
```

Ensure that your local PostgreSQL instance and Kafka broker are running before starting the `practiceservice` or `sessionservice`.

## Global Testing

We enforce rigorous test standards across the ecosystem. Every microservice employs **Testcontainers** to dynamically spin up isolated PostgreSQL databases during the test lifecycle, ensuring consistent and flaky-free integration tests. 

There are currently **280 passing tests** across the ecosystem. 

To run the complete test suite across all modules from the root, ensure Docker Desktop is running and execute:

```bash
mvn clean test
```
*(Alternatively, run `mvn clean test` within any specific microservice directory).*

## Environment Variables

For the `aiservice` to function properly, you will need to supply API keys for the configured models. These can be set as system environment variables before launch:
* `GROQ_API_KEY`
* `GEMINI_API_KEY`

---
*Built for the ultimate technical interview preparation experience.*
