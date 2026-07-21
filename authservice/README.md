# AuthService

The Auth Service manages user registration, email verification, login (JWT generation), and password reset flows.

## Features
- **User Registration**: Create an account with standard details.
- **Email Verification**: Sends a verification token via email (stubbed via `MailService`). Users cannot login until verified.
- **JWT Authentication**: Generates stateless JSON Web Tokens for subsequent API calls.
- **Password Reset**: Generates reset tokens and handles password updates.

## Testing
This service contains an exhaustive test suite:
- **Unit Tests (`AuthServiceTest`)**: Fast Mockito tests for isolated logic.
- **Web Slice Tests (`AuthControllerTest`)**: `@WebMvcTest` verifying endpoint mappings and request/response serialization.
- **Integration Tests (`AuthIntegrationTest`)**: Full end-to-end testing against a real PostgreSQL database provisioned dynamically via **Testcontainers**. Covers duplicate email rejections, token expiration, and secure endpoints.
