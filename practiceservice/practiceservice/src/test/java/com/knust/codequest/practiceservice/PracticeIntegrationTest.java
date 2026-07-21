package com.knust.codequest.practiceservice;

import com.knust.codequest.practiceservice.entity.InterviewSession;
import com.knust.codequest.practiceservice.entity.SessionStatus;
import com.knust.codequest.practiceservice.entity.UserAnswer;
import com.knust.codequest.practiceservice.repository.InterviewSessionRepository;
import com.knust.codequest.practiceservice.repository.UserAnswerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
@Testcontainers
@DisplayName("Practice Service Integration Tests (Testcontainers)")
class PracticeIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
        registry.add("jwt.secret", () -> "a-very-long-dummy-secret-key-for-testing-purposes-only-12345");
        registry.add("question.service.url", () -> "http://localhost:9999"); // dummy, not called in repo tests
    }

    @Autowired
    private InterviewSessionRepository sessionRepository;

    @Autowired
    private UserAnswerRepository answerRepository;

    @Autowired
    private org.springframework.test.web.servlet.MockMvc mockMvc;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private String validJwt;
    private UUID userId;

    @BeforeEach
    void setUp() throws Exception {
        answerRepository.deleteAll();
        sessionRepository.deleteAll();
        userId = UUID.randomUUID();
        
        // Generate a real JWT token for the test user
        String secret = "a-very-long-dummy-secret-key-for-testing-purposes-only-12345";
        javax.crypto.SecretKey key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        
        validJwt = io.jsonwebtoken.Jwts.builder()
                .subject(userId.toString())
                .claim("roles", java.util.List.of("USER"))
                .issuedAt(new java.util.Date())
                .expiration(new java.util.Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1 hour
                .signWith(key)
                .compact();
    }

    // ─── END TO END API FLOWS ───────────────────────────────────────

    @Nested
    @DisplayName("End-to-End API Flows")
    class EndToEndApiTests {

        @Test
        @DisplayName("should complete full session lifecycle")
        void shouldCompleteFullLifecycle() throws Exception {
            // 1. Start Session
            org.springframework.test.web.servlet.MvcResult startResult = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/practice/sessions")
                    .header("Authorization", "Bearer " + validJwt)
                    .param("topicId", "1")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isCreated())
                    .andReturn();

            String jsonResponse = startResult.getResponse().getContentAsString();
            com.knust.codequest.practiceservice.dto.SessionDTO sessionDTO = objectMapper.readValue(jsonResponse, com.knust.codequest.practiceservice.dto.SessionDTO.class);
            UUID sessionId = sessionDTO.sessionId();
            assertNotNull(sessionId);

            // 2. Submit Answer
            com.knust.codequest.practiceservice.dto.SubmitAnswerRequest answerReq = 
                new com.knust.codequest.practiceservice.dto.SubmitAnswerRequest(100L, "This is my answer", 45);

            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/practice/sessions/{id}/answers", sessionId)
                    .header("Authorization", "Bearer " + validJwt)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(answerReq)))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());

            // 3. Complete Session
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/practice/sessions/{id}/complete", sessionId)
                    .header("Authorization", "Bearer " + validJwt))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());

            // 4. Verify in DB
            InterviewSession dbSession = sessionRepository.findById(sessionId).orElseThrow();
            assertEquals(SessionStatus.COMPLETED, dbSession.getStatus());
            assertNotNull(dbSession.getEndTime());

            List<UserAnswer> answers = answerRepository.findBySessionId(sessionId);
            assertEquals(1, answers.size());
            assertEquals(100L, answers.get(0).getQuestionId());
            assertEquals("This is my answer", answers.get(0).getAnswerText());
        }

        @Test
        @DisplayName("should fetch user sessions list via API")
        void shouldFetchUserSessions() throws Exception {
            // Start a session via service directly for setup
            InterviewSession session = createSession(userId, 2);
            session.setStatus(SessionStatus.COMPLETED);
            session.setOverallScore(95);
            sessionRepository.save(session);

            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/practice/sessions")
                    .header("Authorization", "Bearer " + validJwt)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].sessionId").value(session.getId().toString()))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].status").value("COMPLETED"))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].overallScore").value(95));
        }
    }

    // ─── FLYWAY & SCHEMA ────────────────────────────────────────────

    @Nested
    @DisplayName("Database Schema (Flyway)")
    class SchemaTests {

        @Test
        @DisplayName("Flyway migration should run cleanly and tables should exist")
        void flywayMigrationShouldSucceed() {
            // If we reach here, the context loaded and Flyway ran V1 without errors
            assertNotNull(sessionRepository);
            assertNotNull(answerRepository);
        }
    }

    // ─── INTERVIEW SESSION REPOSITORY ───────────────────────────────

    @Nested
    @DisplayName("InterviewSessionRepository")
    class SessionRepositoryTests {

        @Test
        @DisplayName("should persist and retrieve session with generated UUID")
        void shouldPersistAndRetrieve() {
            InterviewSession session = createSession(UUID.randomUUID(), 1);
            session = sessionRepository.save(session);

            assertNotNull(session.getId());
            assertTrue(sessionRepository.findById(session.getId()).isPresent());
        }

        @Test
        @DisplayName("findByUserIdOrderByStartTimeDesc should return sessions sorted newest-first")
        void shouldReturnSessionsOrderedByStartTime() {
            UUID user = UUID.randomUUID();

            InterviewSession older = createSession(user, 1);
            older.setStartTime(LocalDateTime.now().minusHours(2));
            sessionRepository.save(older);

            InterviewSession newer = createSession(user, 2);
            newer.setStartTime(LocalDateTime.now());
            sessionRepository.save(newer);

            List<InterviewSession> results = sessionRepository.findByUserIdOrderByStartTimeDesc(user);

            assertEquals(2, results.size());
            assertTrue(results.get(0).getStartTime().isAfter(results.get(1).getStartTime()));
        }

        @Test
        @DisplayName("findByUserIdAndStatus should filter correctly")
        void shouldFilterByStatus() {
            UUID user = UUID.randomUUID();

            InterviewSession inProgress = createSession(user, 1);
            inProgress.setStatus(SessionStatus.IN_PROGRESS);
            sessionRepository.save(inProgress);

            InterviewSession completed = createSession(user, 2);
            completed.setStatus(SessionStatus.COMPLETED);
            sessionRepository.save(completed);

            List<InterviewSession> active = sessionRepository.findByUserIdAndStatus(user, SessionStatus.IN_PROGRESS);
            assertEquals(1, active.size());
            assertEquals(SessionStatus.IN_PROGRESS, active.get(0).getStatus());
        }

        @Test
        @DisplayName("countAnswersBySessionId should return correct count")
        void shouldCountAnswers() {
            UUID user = UUID.randomUUID();
            InterviewSession session = sessionRepository.save(createSession(user, 1));

            answerRepository.save(createAnswer(session, 10L, "A1"));
            answerRepository.save(createAnswer(session, 11L, "A2"));
            answerRepository.save(createAnswer(session, 12L, "A3"));

            Long count = sessionRepository.countAnswersBySessionId(session.getId());
            assertEquals(3L, count);
        }

        @Test
        @DisplayName("countAnswersBySessionId should return 0 for session with no answers")
        void shouldReturnZeroForNoAnswers() {
            UUID user = UUID.randomUUID();
            InterviewSession session = sessionRepository.save(createSession(user, 1));

            Long count = sessionRepository.countAnswersBySessionId(session.getId());
            assertEquals(0L, count);
        }

        @Test
        @DisplayName("should not return sessions belonging to a different user")
        void shouldIsolateByUser() {
            UUID user1 = UUID.randomUUID();
            UUID user2 = UUID.randomUUID();

            sessionRepository.save(createSession(user1, 1));
            sessionRepository.save(createSession(user2, 2));

            List<InterviewSession> user1Sessions = sessionRepository.findByUserIdOrderByStartTimeDesc(user1);
            assertEquals(1, user1Sessions.size());
            assertEquals(user1, user1Sessions.get(0).getUserId());
        }
    }

    // ─── USER ANSWER REPOSITORY ─────────────────────────────────────

    @Nested
    @DisplayName("UserAnswerRepository")
    class AnswerRepositoryTests {

        @Test
        @DisplayName("should persist answer linked to session via FK")
        void shouldPersistAnswer() {
            UUID user = UUID.randomUUID();
            InterviewSession session = sessionRepository.save(createSession(user, 1));

            UserAnswer answer = createAnswer(session, 42L, "Test answer text");
            answer = answerRepository.save(answer);

            assertNotNull(answer.getId());
            assertEquals(42L, answer.getQuestionId());
        }

        @Test
        @DisplayName("findBySessionIdAndQuestionId should locate exact answer")
        void shouldFindBySessionAndQuestion() {
            UUID user = UUID.randomUUID();
            InterviewSession session = sessionRepository.save(createSession(user, 1));
            answerRepository.save(createAnswer(session, 42L, "Answer"));

            assertTrue(answerRepository.findBySessionIdAndQuestionId(session.getId(), 42L).isPresent());
            assertTrue(answerRepository.findBySessionIdAndQuestionId(session.getId(), 999L).isEmpty());
        }

        @Test
        @DisplayName("findBySessionId should return all answers for a session")
        void shouldFindAllBySession() {
            UUID user = UUID.randomUUID();
            InterviewSession session = sessionRepository.save(createSession(user, 1));

            answerRepository.save(createAnswer(session, 1L, "A1"));
            answerRepository.save(createAnswer(session, 2L, "A2"));

            List<UserAnswer> answers = answerRepository.findBySessionId(session.getId());
            assertEquals(2, answers.size());
        }

        @Test
        @DisplayName("UNIQUE(session_id, question_id) constraint should prevent duplicates")
        void shouldEnforceUniqueConstraint() {
            UUID user = UUID.randomUUID();
            InterviewSession session = sessionRepository.save(createSession(user, 1));

            answerRepository.save(createAnswer(session, 42L, "First"));

            UserAnswer duplicate = createAnswer(session, 42L, "Duplicate");
            assertThrows(DataIntegrityViolationException.class, () -> {
                answerRepository.saveAndFlush(duplicate);
            });
        }

        @Test
        @DisplayName("ON DELETE CASCADE should remove answers when session is deleted")
        void shouldCascadeDeleteAnswers() {
            UUID user = UUID.randomUUID();
            InterviewSession session = sessionRepository.save(createSession(user, 1));

            answerRepository.save(createAnswer(session, 10L, "A1"));
            answerRepository.save(createAnswer(session, 11L, "A2"));
            assertEquals(2, answerRepository.findBySessionId(session.getId()).size());

            sessionRepository.delete(session);
            sessionRepository.flush();
            answerRepository.flush();

            assertEquals(0, answerRepository.findBySessionId(session.getId()).size());
        }
    }

    // ─── HELPERS ────────────────────────────────────────────────────

    private InterviewSession createSession(UUID userId, Integer topicId) {
        InterviewSession session = new InterviewSession();
        session.setUserId(userId);
        session.setTopicId(topicId);
        session.setStatus(SessionStatus.IN_PROGRESS);
        session.setStartTime(LocalDateTime.now());
        return session;
    }

    private UserAnswer createAnswer(InterviewSession session, Long questionId, String text) {
        UserAnswer answer = new UserAnswer();
        answer.setSession(session);
        answer.setQuestionId(questionId);
        answer.setAnswerText(text);
        answer.setAnswerDurationSeconds(30);
        return answer;
    }
}
