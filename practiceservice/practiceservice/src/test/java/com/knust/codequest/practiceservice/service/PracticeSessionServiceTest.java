package com.knust.codequest.practiceservice.service;

import com.knust.codequest.practiceservice.exception.SessionNotFoundException;
import com.knust.codequest.practiceservice.model.dto.*;
import com.knust.codequest.practiceservice.model.entity.PracticeSession;
import com.knust.codequest.practiceservice.model.entity.SessionAnswer;
import com.knust.codequest.practiceservice.model.enums.SessionStatus;
import com.knust.codequest.practiceservice.repository.PracticeSessionRepository;
import com.knust.codequest.practiceservice.repository.SessionAnswerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PracticeSessionServiceTest {

    @Mock
    private PracticeSessionRepository sessionRepo;

    @Mock
    private SessionAnswerRepository answerRepo;

    @Mock
    private AdaptiveQuestionSelector questionSelector;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private Clock clock;
    
    private PracticeSessionService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final String deckId = "java-basics";
    private final Instant fixedNow = Instant.parse("2026-07-13T10:00:00Z");

    @Captor
    private ArgumentCaptor<PracticeSession> sessionCaptor;
    
    @Captor
    private ArgumentCaptor<SessionAnswer> answerCaptor;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(fixedNow, ZoneOffset.UTC);
        service = new PracticeSessionService(sessionRepo, answerRepo, questionSelector, kafkaTemplate, clock);
    }

    private PracticeSession createSession(SessionStatus status) {
        PracticeSession session = new PracticeSession();
        session.setId(sessionId);
        session.setUserId(userId);
        session.setDeckId(deckId);
        session.setStatus(status);
        session.setCurrentQuestionIndex(0);
        session.setTotalQuestions(3);
        session.setQuestionQueue(List.of(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));
        session.setAnswers(new ArrayList<>());
        session.setAdaptive(true);
        session.setCurrentDifficulty("MEDIUM");
        return session;
    }

    @Nested
    class StartSession {
        @Test
        void startSession_nominal_savesAndReturnsState() {
            List<UUID> queue = List.of(UUID.randomUUID(), UUID.randomUUID());
            when(questionSelector.selectInitialQueue(eq(deckId), eq(10), eq(true), eq(userId)))
                .thenReturn(queue);

            StartSessionRequest.SessionConfig config = new StartSessionRequest.SessionConfig(10, null, true);
            StartSessionRequest req = new StartSessionRequest(deckId, config);

            SessionState state = service.startSession(userId, req);

            verify(sessionRepo).save(sessionCaptor.capture());
            PracticeSession saved = sessionCaptor.getValue();
            assertEquals(SessionStatus.IN_PROGRESS, saved.getStatus());
            assertEquals(true, saved.getAdaptive());
            assertEquals(2, saved.getTotalQuestions());
            
            assertNotNull(state);
            assertEquals(SessionStatus.IN_PROGRESS, state.status());
        }

        @Test
        void startSession_nullConfig_usesDefaults() {
            when(questionSelector.selectInitialQueue(eq(deckId), eq(10), eq(true), eq(userId)))
                .thenReturn(List.of(UUID.randomUUID()));

            StartSessionRequest req = new StartSessionRequest(deckId, null);

            service.startSession(userId, req);

            verify(sessionRepo).save(sessionCaptor.capture());
            assertEquals(true, sessionCaptor.getValue().getAdaptive());
        }

        @Test
        void startSession_noQuestions_throwsException() {
            when(questionSelector.selectInitialQueue(any(), anyInt(), anyBoolean(), any()))
                .thenReturn(List.of());

            StartSessionRequest req = new StartSessionRequest(deckId, null);

            assertThrows(IllegalStateException.class, () -> service.startSession(userId, req));
        }
    }

    @Nested
    class GetSessionState {
        @Test
        void foundOwnSession_returnsState() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            SessionState state = service.getSessionState(sessionId, userId);
            assertNotNull(state);
        }

        @Test
        void foundWrongUser_throwsSessionNotFound() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            assertThrows(SessionNotFoundException.class, () -> service.getSessionState(sessionId, UUID.randomUUID()));
        }

        @Test
        void notFound_throwsSessionNotFound() {
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.empty());
            assertThrows(SessionNotFoundException.class, () -> service.getSessionState(sessionId, userId));
        }
    }

    @Nested
    class SubmitAnswer {
        @Test
        void submitAnswer_firstAnswer_savesAnswerAndAdapts() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            SubmitAnswerRequest req = new SubmitAnswerRequest("int x = 5;", 1500, true, null);
            SubmitAnswerResponse res = service.submitAnswer(sessionId, userId, req);

            assertTrue(res.accepted());
            assertTrue(res.nextAvailable());
            
            verify(answerRepo).save(answerCaptor.capture());
            assertEquals(session.getCurrentQuestionId(), answerCaptor.getValue().getQuestionId());
            assertEquals(true, answerCaptor.getValue().getIsCorrect());
            
            verify(questionSelector).adaptQueueAfterAnswer(session, true);
        }

        @Test
        void submitAnswer_alreadyAnswered_returnsFalse() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            SessionAnswer ans = new SessionAnswer();
            ans.setQuestionId(session.getCurrentQuestionId());
            session.getAnswers().add(ans);
            
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            SubmitAnswerResponse res = service.submitAnswer(sessionId, userId, new SubmitAnswerRequest("x", 100, true, null));
            assertFalse(res.accepted());
            verify(answerRepo, never()).save(any());
        }

        @Test
        void submitAnswer_notInProgress_throwsException() {
            PracticeSession session = createSession(SessionStatus.COMPLETED);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            assertThrows(IllegalStateException.class, 
                () -> service.submitAnswer(sessionId, userId, new SubmitAnswerRequest("x", 100, true, null)));
        }

        @Test
        void submitAnswer_adaptiveFalse_doesNotAdapt() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            session.setAdaptive(false);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            service.submitAnswer(sessionId, userId, new SubmitAnswerRequest("x", 100, true, null));

            verify(questionSelector, never()).adaptQueueAfterAnswer(any(), anyBoolean());
        }
    }

    @Nested
    class NextQuestion {
        @Test
        void currentAnswered_advancesIndex() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            SessionAnswer ans = new SessionAnswer();
            ans.setQuestionId(session.getCurrentQuestionId());
            session.getAnswers().add(ans);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            when(questionSelector.fetchQuestion(any())).thenReturn(
                new NextQuestionResponse.QuestionDto(UUID.randomUUID(), "title", "content", "EASY", "hint", "cat")
            );
            NextQuestionResponse res = service.nextQuestion(sessionId, userId);
            
            assertEquals(1, session.getCurrentQuestionIndex());
            assertNotNull(res.question().id());
            assertTrue(res.hasMore());
        }

        @Test
        void currentNotAnswered_throwsException() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            assertThrows(IllegalStateException.class, () -> service.nextQuestion(sessionId, userId));
        }

        @Test
        void exhausted_hasMoreFalse() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            session.setCurrentQuestionIndex(2); // last question
            SessionAnswer ans = new SessionAnswer();
            ans.setQuestionId(session.getCurrentQuestionId());
            session.getAnswers().add(ans);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            NextQuestionResponse res = service.nextQuestion(sessionId, userId);
            
            assertNull(res.question());
            assertFalse(res.hasMore());
        }
    }

    @Nested
    class CompleteSession {
        @Test
        void nominal_completesAndSendsKafka() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            SessionAnswer ans = new SessionAnswer();
            ans.setIsCorrect(true);
            ans.setDurationMs(1000);
            session.getAnswers().add(ans);
            
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            SessionResult res = service.completeSession(sessionId, userId);
            
            assertEquals(SessionStatus.COMPLETED, session.getStatus());
            assertEquals(fixedNow, session.getCompletedAt());
            // 1 correct out of 3 = score 33
            assertEquals(33, res.score());
            
            verify(kafkaTemplate).send(eq("session.completed"), any());
            verify(sessionRepo).save(session);
        }

        @Test
        void abandoned_throwsException() {
            PracticeSession session = createSession(SessionStatus.ABANDONED);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            assertThrows(IllegalStateException.class, () -> service.completeSession(sessionId, userId));
        }
        
        @Test
        void zeroQuestions_scoreZero() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            session.setTotalQuestions(0);
            when(sessionRepo.findById(sessionId)).thenReturn(Optional.of(session));

            SessionResult res = service.completeSession(sessionId, userId);
            assertEquals(0, res.score());
        }
    }

    @Nested
    class AbandonSession {
        @Test
        void nominal_abandons() {
            PracticeSession session = createSession(SessionStatus.IN_PROGRESS);
            when(sessionRepo.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));

            service.abandonSession(sessionId, userId);
            
            assertEquals(SessionStatus.ABANDONED, session.getStatus());
            verify(sessionRepo).save(session);
        }
    }

    @Nested
    class SyncOfflineSession {
        @Test
        void nominal_new_syncsAndGrades() {
            when(sessionRepo.findByClientSessionId("client123")).thenReturn(Optional.empty());
            when(sessionRepo.save(any())).thenAnswer(i -> { PracticeSession s = i.getArgument(0); s.setId(java.util.UUID.randomUUID()); return s; });
            when(questionSelector.gradeAnswerInternally(any(), any(), any())).thenReturn(true);

            SyncPayload payload = new SyncPayload(
                "client123",
                deckId,
                Instant.now().minusSeconds(60),
                Instant.now(),
                List.of(
                    new SyncPayload.SessionAnswerPayload(UUID.randomUUID(), null, "ans1", 1000)
                )
            );

            SessionResult result = service.syncOfflineSession(userId, payload);
            
            assertNotNull(result.sessionId());
            
            verify(sessionRepo, times(2)).save(any());
            verify(answerRepo, times(1)).save(any());
            verify(kafkaTemplate).send(eq("session.completed"), any());
        }

        @Test
        void duplicateClientSessionId_throwsException() {
            when(sessionRepo.findByClientSessionId("client123")).thenReturn(Optional.of(new PracticeSession()));

            SyncPayload payload = new SyncPayload("client123", deckId, Instant.now(), Instant.now(), List.of());
            
            assertThrows(IllegalStateException.class, () -> service.syncOfflineSession(userId, payload));
        }

        @Test
        void completedBeforeStarted_throwsException() {
            when(sessionRepo.findByClientSessionId("client123")).thenReturn(Optional.empty());

            SyncPayload payload = new SyncPayload(
                "client123", deckId, 
                Instant.now(), // started
                Instant.now().minusSeconds(60), // completed before started
                List.of()
            );
            
            assertThrows(IllegalArgumentException.class, () -> service.syncOfflineSession(userId, payload));
        }

        @Test
        void duplicateQuestionIds_throwsException() {
            when(sessionRepo.findByClientSessionId("client123")).thenReturn(Optional.empty());
            UUID q1 = UUID.randomUUID();

            SyncPayload payload = new SyncPayload(
                "client123", deckId, 
                Instant.now().minusSeconds(60), Instant.now(), 
                List.of(
                    new SyncPayload.SessionAnswerPayload(q1, null, "ans1", 1000),
                    new SyncPayload.SessionAnswerPayload(q1, null, "ans2", 1000) // duplicate
                )
            );
            
            assertThrows(IllegalArgumentException.class, () -> service.syncOfflineSession(userId, payload));
        }
    }
}
