package com.knust.codequest.sessionservice.service;

import com.knust.codequest.sessionservice.model.dto.SessionCompletedEvent;
import com.knust.codequest.sessionservice.model.dto.SessionCompletedEvent.SessionAnswerEvent;
import com.knust.codequest.sessionservice.model.entity.CompletedSession;
import com.knust.codequest.sessionservice.model.entity.DailyActivity;
import com.knust.codequest.sessionservice.model.entity.UserLevel;
import com.knust.codequest.sessionservice.repository.CompletedSessionRepository;
import com.knust.codequest.sessionservice.repository.DailyActivityRepository;
import com.knust.codequest.sessionservice.repository.UserLevelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionIngestServiceTest {

    @Mock
    private CompletedSessionRepository sessionRepo;

    @Mock
    private DailyActivityRepository activityRepo;

    @Mock
    private UserLevelRepository userLevelRepo;

    @Mock
    private XpCalculator xpCalculator;

    private Clock clock;
    
    private SessionIngestService sessionIngestService;

    @Captor
    private ArgumentCaptor<CompletedSession> sessionCaptor;

    @Captor
    private ArgumentCaptor<UserLevel> userLevelCaptor;

    @Captor
    private ArgumentCaptor<DailyActivity> activityCaptor;

    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final Instant fixedNow = Instant.parse("2026-07-13T10:00:00Z");

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(fixedNow, ZoneOffset.UTC);
        sessionIngestService = new SessionIngestService(sessionRepo, activityRepo, userLevelRepo, xpCalculator, clock);
    }

    private SessionCompletedEvent buildEvent(List<SessionAnswerEvent> answers) {
        return new SessionCompletedEvent(
                sessionId,
                userId,
                "default",
                100,
                answers,
                60000,
                fixedNow
        );
    }

    @Nested
    class Idempotency {
        @Test
        void duplicateSession_returnsImmediately() {
            when(sessionRepo.existsById(sessionId)).thenReturn(true);

            sessionIngestService.ingest(buildEvent(List.of()));

            verify(sessionRepo, never()).save(any());
            verify(userLevelRepo, never()).save(any());
            verify(activityRepo, never()).save(any());
        }
    }

    @Nested
    class IngestionLogic {

        @BeforeEach
        void setupMocks() {
            when(sessionRepo.existsById(sessionId)).thenReturn(false);
            when(xpCalculator.calculateXp(any(), anyInt(), anyInt(), anyInt(), anyBoolean()))
                    .thenReturn(new XpCalculator.XpCalculationResult(250, Map.of()));
            when(xpCalculator.getLevelFromXp(anyInt())).thenReturn(2);
            when(xpCalculator.getXpForLevel(2)).thenReturn(100);
        }

        @Test
        void newSession_savesAllEntities() {
            when(activityRepo.findByUserIdAndDate(eq(userId), any())).thenReturn(Optional.empty());
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());

            SessionCompletedEvent event = buildEvent(List.of(
                    new SessionAnswerEvent(UUID.randomUUID(), "ans1", 10000, true)
            ));

            sessionIngestService.ingest(event);

            verify(sessionRepo).save(sessionCaptor.capture());
            verify(userLevelRepo).save(userLevelCaptor.capture());
            verify(activityRepo).save(activityCaptor.capture());

            assertEquals(1, sessionCaptor.getValue().getAnsweredQuestions());
            assertEquals(250, userLevelCaptor.getValue().getTotalXp());
            assertEquals(1, activityCaptor.getValue().getSessionsCompleted());
        }

        @Test
        void answeredQuestions_ignoresBlanks() {
            when(activityRepo.findByUserIdAndDate(eq(userId), any())).thenReturn(Optional.empty());
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());

            SessionCompletedEvent event = buildEvent(List.of(
                    new SessionAnswerEvent(UUID.randomUUID(), "ans1", 10000, true),
                    new SessionAnswerEvent(UUID.randomUUID(), "   ", 5000, false), // blank
                    new SessionAnswerEvent(UUID.randomUUID(), null, 5000, false) // null
            ));

            sessionIngestService.ingest(event);

            verify(sessionRepo).save(sessionCaptor.capture());
            assertEquals(1, sessionCaptor.getValue().getAnsweredQuestions());
        }

        @Test
        void isDailyFirstWin_trueForNewActivity() {
            when(activityRepo.findByUserIdAndDate(eq(userId), any())).thenReturn(Optional.empty());
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());

            sessionIngestService.ingest(buildEvent(List.of()));

            verify(xpCalculator).calculateXp(any(), anyInt(), anyInt(), anyInt(), eq(true));
        }

        @Test
        void isDailyFirstWin_falseForExistingActivity() {
            DailyActivity existingActivity = new DailyActivity();
            existingActivity.setSessionsCompleted(1);
            when(activityRepo.findByUserIdAndDate(eq(userId), any())).thenReturn(Optional.of(existingActivity));
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());

            sessionIngestService.ingest(buildEvent(List.of()));

            verify(xpCalculator).calculateXp(any(), anyInt(), anyInt(), anyInt(), eq(false));
        }

        @Test
        void maxCombo_computedCorrectly() {
            when(activityRepo.findByUserIdAndDate(eq(userId), any())).thenReturn(Optional.empty());
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());

            SessionCompletedEvent event = buildEvent(List.of(
                    new SessionAnswerEvent(UUID.randomUUID(), "1", 1000, true),
                    new SessionAnswerEvent(UUID.randomUUID(), "2", 1000, true),
                    new SessionAnswerEvent(UUID.randomUUID(), "3", 1000, true), // combo 3
                    new SessionAnswerEvent(UUID.randomUUID(), "4", 1000, false), // break combo
                    new SessionAnswerEvent(UUID.randomUUID(), "5", 1000, true),
                    new SessionAnswerEvent(UUID.randomUUID(), "6", 1000, true) // combo 2
            ));

            sessionIngestService.ingest(event);

            // args: session, streakDays, maxCombo, speed, dailyFirst
            verify(xpCalculator).calculateXp(any(), anyInt(), eq(3), anyInt(), anyBoolean());
        }

        @Test
        void avgCorrectSpeedMs_computedCorrectly() {
            when(activityRepo.findByUserIdAndDate(eq(userId), any())).thenReturn(Optional.empty());
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());

            SessionCompletedEvent event = buildEvent(List.of(
                    new SessionAnswerEvent(UUID.randomUUID(), "1", 10000, true),
                    new SessionAnswerEvent(UUID.randomUUID(), "2", 20000, true),
                    new SessionAnswerEvent(UUID.randomUUID(), "3", 50000, false) // ignored for speed
            ));

            sessionIngestService.ingest(event);

            // avg = (10000 + 20000) / 2 = 15000
            verify(xpCalculator).calculateXp(any(), anyInt(), anyInt(), eq(15000), anyBoolean());
        }

        @Test
        void streak_computedFromPastActivity() {
            LocalDate today = LocalDate.now(clock);
            
            // Return true for yesterday and the day before, empty for 3 days ago
            DailyActivity pastActivity = new DailyActivity();
            pastActivity.setSessionsCompleted(1);
            
            when(activityRepo.findByUserIdAndDate(userId, today)).thenReturn(Optional.empty());
            when(activityRepo.findByUserIdAndDate(userId, today.minusDays(1))).thenReturn(Optional.of(pastActivity));
            when(activityRepo.findByUserIdAndDate(userId, today.minusDays(2))).thenReturn(Optional.of(pastActivity));
            when(activityRepo.findByUserIdAndDate(userId, today.minusDays(3))).thenReturn(Optional.empty());
            
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());

            sessionIngestService.ingest(buildEvent(List.of()));

            // streak should be 2
            verify(xpCalculator).calculateXp(any(), eq(2), anyInt(), anyInt(), anyBoolean());
        }

        @Test
        void userLevel_accumulatesXp() {
            when(activityRepo.findByUserIdAndDate(eq(userId), any())).thenReturn(Optional.empty());
            
            UserLevel existingLevel = new UserLevel(userId, 100, 2, 0);
            when(userLevelRepo.findById(userId)).thenReturn(Optional.of(existingLevel));

            sessionIngestService.ingest(buildEvent(List.of()));

            verify(userLevelRepo).save(userLevelCaptor.capture());
            
            // existing 100 + new 250 (from mock) = 350
            assertEquals(350, userLevelCaptor.getValue().getTotalXp());
        }
    }
}
