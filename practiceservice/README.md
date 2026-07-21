# PracticeService

The Practice Service manages user interview sessions, tracking progress, answers, and time limits.

## Features
- **Session Management**: Start and complete interview practice sessions.
- **Time Limits**: Enforces a strict 30-minute time limit on sessions.
- **Question & Answer Flow**: Validates submissions and associates answers securely with the session.
- **AI Integration (Pending)**: Triggers AI evaluation when a session is completed.

## Testing
This service is fully covered with 40 automated tests:
- **Unit Tests (`PracticeServiceTest`)**: Mocked tests ensuring time limits and ownership validations are robust.
- **Controller Tests (`PracticeControllerTest`)**: Mocks the service layer to ensure HTTP boundaries are correct.
- **Integration Tests (`PracticeIntegrationTest`)**: Uses **Testcontainers** for a real PostgreSQL database, generating JWTs dynamically to thoroughly test the full E2E flow from the REST controller to the Flyway migrations and DB constraints.
