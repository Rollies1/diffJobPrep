package com.knust.codequest.practiceservice.service;

import com.knust.codequest.practiceservice.dto.SessionSummaryDTO;
import com.knust.codequest.practiceservice.entity.InterviewSession;
import com.knust.codequest.practiceservice.entity.SessionStatus;
import com.knust.codequest.practiceservice.entity.UserAnswer;
import com.knust.codequest.practiceservice.exception.BadRequestException;
import com.knust.codequest.practiceservice.exception.ResourceNotFoundException;
import com.knust.codequest.practiceservice.exception.UnauthorizedException;
import com.knust.codequest.practiceservice.repository.InterviewSessionRepository;
import com.knust.codequest.practiceservice.repository.UserAnswerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PracticeService Unit Tests")
class PracticeServiceTest {

    @Mock
    private InterviewSessionRepository sessionRepository;

    @Mock
    private UserAnswerRepository answerRepository;

    @InjectMocks
    private PracticeService practiceService;

    @Captor
    private ArgumentCaptor<InterviewSession> sessionCaptor;

    @Captor
    private ArgumentCaptor<UserAnswer> answerCaptor;

    private UUID sessionId;
    private UUID userId;
    private InterviewSession activeSession;

    @BeforeEach
    void setUp() {
        sessionId = UUID.randomUUID();
        userId = UUID.randomUUID();

        activeSession = new InterviewSession();
        activeSession.setId(sessionId);
        activeSession.setUserId(userId);
        activeSession.setTopicId(1);
        activeSession.setStatus(SessionStatus.IN_PROGRESS);
        activeSession.setStartTime(LocalDateTime.now());
    }

    // ─── START SESSION ──────────────────────────────────────────────

    @Nested
    @DisplayName("startSession()")
    class StartSession {

        @Test
        @DisplayName("should save session with correct fields and return generated ID")
        void shouldSaveAndReturnSessionId() {
            when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(i -> {
                InterviewSession s = i.getArgument(0);
                s.setId(sessionId);
                return s;
            });

            UUID resultId = practiceService.startSession(1, userId);

            assertNotNull(resultId);
            assertEquals(sessionId, resultId);

            verify(sessionRepository).save(sessionCaptor.capture());
            InterviewSession captured = sessionCaptor.getValue();
            assertEquals(userId, captured.getUserId());
            assertEquals(1, captured.getTopicId());
            assertEquals(SessionStatus.IN_PROGRESS, captured.getStatus());
        }

        @Test
        @DisplayName("should set status to IN_PROGRESS by default")
        void shouldDefaultToInProgress() {
            when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(i -> {
                InterviewSession s = i.getArgument(0);
                s.setId(UUID.randomUUID());
                return s;
            });

            practiceService.startSession(99, userId);

            verify(sessionRepository).save(sessionCaptor.capture());
            assertEquals(SessionStatus.IN_PROGRESS, sessionCaptor.getValue().getStatus());
        }
    }

    // ─── SUBMIT ANSWER ──────────────────────────────────────────────

    @Nested
    @DisplayName("submitAnswer()")
    class SubmitAnswer {

        @Test
        @DisplayName("should create new answer when none exists for this question")
        void shouldCreateNewAnswer() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(activeSession));
            when(answerRepository.findBySessionIdAndQuestionId(sessionId, 100L)).thenReturn(Optional.empty());
            when(answerRepository.save(any(UserAnswer.class))).thenAnswer(i -> i.getArgument(0));

            practiceService.submitAnswer(sessionId, 100L, "My Answer", 45, userId);

            verify(answerRepository).save(answerCaptor.capture());
            UserAnswer captured = answerCaptor.getValue();
            assertEquals(100L, captured.getQuestionId());
            assertEquals("My Answer", captured.getAnswerText());
            assertEquals(45, captured.getAnswerDurationSeconds());
            assertEquals(activeSession, captured.getSession());
        }

        @Test
        @DisplayName("should update existing answer (upsert behavior)")
        void shouldUpsertExistingAnswer() {
            UserAnswer existingAnswer = new UserAnswer();
            existingAnswer.setId(UUID.randomUUID());
            existingAnswer.setSession(activeSession);
            existingAnswer.setQuestionId(100L);
            existingAnswer.setAnswerText("Old Answer");
            existingAnswer.setAnswerDurationSeconds(20);

            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(activeSession));
            when(answerRepository.findBySessionIdAndQuestionId(sessionId, 100L)).thenReturn(Optional.of(existingAnswer));
            when(answerRepository.save(any(UserAnswer.class))).thenAnswer(i -> i.getArgument(0));

            practiceService.submitAnswer(sessionId, 100L, "Updated Answer", 60, userId);

            verify(answerRepository).save(answerCaptor.capture());
            UserAnswer captured = answerCaptor.getValue();
            assertEquals("Updated Answer", captured.getAnswerText());
            assertEquals(60, captured.getAnswerDurationSeconds());
            // Same entity was reused, not a new one
            assertEquals(existingAnswer.getId(), captured.getId());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when session does not exist")
        void shouldThrowWhenSessionNotFound() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () ->
                practiceService.submitAnswer(sessionId, 100L, "My Answer", 45, userId)
            );

            verify(answerRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw UnauthorizedException when user does not own the session")
        void shouldThrowWhenWrongUser() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(activeSession));

            UUID intruderId = UUID.randomUUID();
            assertThrows(UnauthorizedException.class, () ->
                practiceService.submitAnswer(sessionId, 100L, "My Answer", 45, intruderId)
            );

            verify(answerRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException and set TIMEOUT when 30-min limit exceeded")
        void shouldTimeoutWhenLimitExceeded() {
            activeSession.setStartTime(LocalDateTime.now().minusMinutes(31));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(activeSession));

            BadRequestException ex = assertThrows(BadRequestException.class, () ->
                practiceService.submitAnswer(sessionId, 100L, "My Answer", 45, userId)
            );

            assertTrue(ex.getMessage().contains("30 minutes"));
            assertEquals(SessionStatus.TIMEOUT, activeSession.getStatus());
            verify(answerRepository, never()).save(any());
        }

        @Test
        @DisplayName("should allow submission at exactly 29 minutes (within limit)")
        void shouldAllowAtBoundary() {
            activeSession.setStartTime(LocalDateTime.now().minusMinutes(29));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(activeSession));
            when(answerRepository.findBySessionIdAndQuestionId(sessionId, 100L)).thenReturn(Optional.empty());
            when(answerRepository.save(any(UserAnswer.class))).thenAnswer(i -> i.getArgument(0));

            assertDoesNotThrow(() ->
                practiceService.submitAnswer(sessionId, 100L, "My Answer", 45, userId)
            );

            verify(answerRepository).save(any(UserAnswer.class));
        }
    }

    // ─── COMPLETE SESSION ───────────────────────────────────────────

    @Nested
    @DisplayName("completeSession()")
    class CompleteSession {

        @Test
        @DisplayName("should set status to COMPLETED and populate endTime")
        void shouldMarkCompleted() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(activeSession));

            practiceService.completeSession(sessionId, userId);

            assertEquals(SessionStatus.COMPLETED, activeSession.getStatus());
            assertNotNull(activeSession.getEndTime());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when session does not exist")
        void shouldThrowWhenNotFound() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () ->
                practiceService.completeSession(sessionId, userId)
            );
        }

        @Test
        @DisplayName("should throw UnauthorizedException when user does not own the session")
        void shouldThrowWhenWrongUser() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(activeSession));

            assertThrows(UnauthorizedException.class, () ->
                practiceService.completeSession(sessionId, UUID.randomUUID())
            );
        }
    }

    // ─── GET USER SESSIONS ──────────────────────────────────────────

    @Nested
    @DisplayName("getUserSessions()")
    class GetUserSessions {

        @Test
        @DisplayName("should return empty list when user has no sessions")
        void shouldReturnEmptyList() {
            when(sessionRepository.findByUserIdOrderByStartTimeDesc(userId)).thenReturn(Collections.emptyList());

            List<SessionSummaryDTO> result = practiceService.getUserSessions(userId);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("should map sessions to SessionSummaryDTO with correct answer counts")
        void shouldMapToSummaryDTO() {
            InterviewSession s1 = new InterviewSession();
            s1.setId(sessionId);
            s1.setUserId(userId);
            s1.setTopicId(3);
            s1.setStatus(SessionStatus.COMPLETED);
            s1.setStartTime(LocalDateTime.now().minusHours(1));
            s1.setEndTime(LocalDateTime.now());
            s1.setOverallScore(85);

            when(sessionRepository.findByUserIdOrderByStartTimeDesc(userId)).thenReturn(List.of(s1));
            when(sessionRepository.countAnswersBySessionId(sessionId)).thenReturn(5L);

            List<SessionSummaryDTO> result = practiceService.getUserSessions(userId);

            assertEquals(1, result.size());
            SessionSummaryDTO dto = result.get(0);
            assertEquals(sessionId, dto.sessionId());
            assertEquals(3, dto.topicId());
            assertEquals(SessionStatus.COMPLETED, dto.status());
            assertEquals(85, dto.overallScore());
            assertEquals(5L, dto.answersSubmitted());
        }
    }
}
