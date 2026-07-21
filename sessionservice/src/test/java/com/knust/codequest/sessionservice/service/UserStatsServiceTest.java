package com.knust.codequest.sessionservice.service;

import com.knust.codequest.sessionservice.model.dto.CursorPage;
import com.knust.codequest.sessionservice.model.dto.DailyActivityDto;
import com.knust.codequest.sessionservice.model.dto.SessionHistoryItem;
import com.knust.codequest.sessionservice.model.dto.UserStats;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserStatsServiceTest {

    @Mock
    private CompletedSessionRepository sessionRepo;

    @Mock
    private DailyActivityRepository activityRepo;

    @Mock
    private UserLevelRepository userLevelRepo;

    @Mock
    private XpCalculator xpCalculator;

    private Clock clock;

    private UserStatsService userStatsService;

    private final UUID userId = UUID.randomUUID();
    private final Instant fixedNow = Instant.parse("2026-07-13T10:00:00Z");

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(fixedNow, ZoneOffset.UTC);
        userStatsService = new UserStatsService(sessionRepo, activityRepo, userLevelRepo, xpCalculator, clock);
    }

    @Nested
    class GetStats {

        @Test
        void getsStatsCorrectly_withActivity() {
            when(sessionRepo.countByUserIdSince(eq(userId), any())).thenReturn(3L);
            when(sessionRepo.sumAnsweredByUserIdSince(eq(userId), any())).thenReturn(50);
            
            DailyActivity act1 = new DailyActivity();
            act1.setSessionsCompleted(2);
            act1.setQuestionsAnswered(20);
            DailyActivity act2 = new DailyActivity();
            act2.setSessionsCompleted(3);
            act2.setQuestionsAnswered(30);
            
            when(activityRepo.findSince(eq(userId), any(LocalDate.class))).thenReturn(List.of(act1, act2));
            
            UserLevel level = new UserLevel(userId, 500, 3, 50);
            when(userLevelRepo.findById(userId)).thenReturn(Optional.of(level));
            when(xpCalculator.getXpToNextLevel(500)).thenReturn(250);
            when(xpCalculator.getRankName(3)).thenReturn("Bronze");
            
            // For computeStreak
            LocalDate today = LocalDate.now(clock);
            when(activityRepo.findByUserIdAndDate(userId, today)).thenReturn(Optional.of(act2));
            when(activityRepo.findByUserIdAndDate(userId, today.minusDays(1))).thenReturn(Optional.of(act1));
            when(activityRepo.findByUserIdAndDate(userId, today.minusDays(2))).thenReturn(Optional.empty());

            UserStats stats = userStatsService.getStats(userId);

            assertEquals(3.0 / 5.0, stats.weeklyGoal());
            assertEquals(50.0 / (5 * 3), stats.completionRate());
            assertEquals(2, stats.streakDays());
            assertEquals(50, stats.totalAnswered());
            assertEquals(3, stats.weeklySessions());
            assertEquals(50, stats.weeklyQuestions());
            assertEquals(500, stats.totalXp());
            assertEquals(3, stats.currentLevel());
            assertEquals(50, stats.xpInCurrentLevel());
            assertEquals(250, stats.xpToNextLevel());
            assertEquals("Bronze", stats.rankName());
        }

        @Test
        void getsStatsCorrectly_noActivity() {
            when(sessionRepo.countByUserIdSince(eq(userId), any())).thenReturn(0L);
            when(sessionRepo.sumAnsweredByUserIdSince(eq(userId), any())).thenReturn(null);
            when(activityRepo.findSince(eq(userId), any(LocalDate.class))).thenReturn(List.of());
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());
            
            LocalDate today = LocalDate.now(clock);
            when(activityRepo.findByUserIdAndDate(userId, today)).thenReturn(Optional.empty());

            UserStats stats = userStatsService.getStats(userId);

            assertEquals(0.0, stats.weeklyGoal());
            assertEquals(0.0, stats.completionRate());
            assertEquals(0, stats.streakDays());
            assertEquals(0, stats.totalAnswered());
            assertEquals(0, stats.weeklySessions());
            assertEquals(0, stats.weeklyQuestions());
            assertEquals(0, stats.totalXp());
            assertEquals(1, stats.currentLevel());
        }

        @Test
        void weeklyGoal_cappedAtOne() {
            when(sessionRepo.countByUserIdSince(eq(userId), any())).thenReturn(10L); // > 5
            when(activityRepo.findSince(eq(userId), any(LocalDate.class))).thenReturn(List.of());
            when(userLevelRepo.findById(userId)).thenReturn(Optional.empty());
            when(activityRepo.findByUserIdAndDate(userId, LocalDate.now(clock))).thenReturn(Optional.empty());

            UserStats stats = userStatsService.getStats(userId);

            assertEquals(1.0, stats.weeklyGoal()); // Not 2.0
        }
    }

    @Nested
    class GetHistory {
        
        @Test
        void noCursor_usesBaseQuery() {
            Pageable pageable = PageRequest.of(0, 5);
            CompletedSession session = new CompletedSession(UUID.randomUUID(), userId, "d1", 100, 10, 10, 500, fixedNow);
            when(sessionRepo.findByUserIdOrderByCompletedAtDescIdDesc(userId, pageable)).thenReturn(new PageImpl<>(List.of(session)));

            CursorPage<SessionHistoryItem> result = userStatsService.getHistory(userId, null, 5);

            verify(sessionRepo).findByUserIdOrderByCompletedAtDescIdDesc(userId, pageable);
            assertEquals(1, result.data().size());
            assertFalse(result.hasMore());
            assertNull(result.nextCursor());
        }

        @Test
        void withCursor_usesCursorQuery() {
            Pageable pageable = PageRequest.of(0, 5);
            UUID lastId = UUID.randomUUID();
            String cursor = fixedNow.toEpochMilli() + "_" + lastId;
            
            CompletedSession session = new CompletedSession(UUID.randomUUID(), userId, "d1", 100, 10, 10, 500, fixedNow.minusSeconds(10));
            when(sessionRepo.findByUserIdAndCursor(userId, fixedNow, lastId, pageable)).thenReturn(new PageImpl<>(List.of(session)));

            CursorPage<SessionHistoryItem> result = userStatsService.getHistory(userId, cursor, 5);

            verify(sessionRepo).findByUserIdAndCursor(userId, fixedNow, lastId, pageable);
            assertEquals(1, result.data().size());
        }

        @Test
        void hasNextPage_generatesNextCursor() {
            Pageable pageable = PageRequest.of(0, 1);
            UUID sessionId1 = UUID.randomUUID();
            UUID sessionId2 = UUID.randomUUID();
            CompletedSession session = new CompletedSession(sessionId1, userId, "d1", 100, 10, 10, 500, fixedNow);
            
            when(sessionRepo.findByUserIdOrderByCompletedAtDescIdDesc(userId, pageable))
                .thenReturn(new PageImpl<>(List.of(session), pageable, 2));

            CursorPage<SessionHistoryItem> result = userStatsService.getHistory(userId, null, 1);

            assertTrue(result.hasMore());
            assertEquals(fixedNow.toEpochMilli() + "_" + sessionId1, result.nextCursor());
        }
    }

    @Nested
    class GetActivity {
        
        @Test
        void fillsMissingDays() {
            LocalDate startDate = LocalDate.now(clock).minusDays(6); // 7 days total
            
            DailyActivity act = new DailyActivity();
            act.setDate(startDate.plusDays(2));
            act.setSessionsCompleted(2);
            act.setQuestionsAnswered(15);
            act.setTotalDurationMs(3000); // 3 seconds
            act.setScoreSum(180);
            act.setXpEarned(250);
            
            when(activityRepo.findSince(userId, startDate)).thenReturn(List.of(act));

            List<DailyActivityDto> result = userStatsService.getActivity(userId, 7);

            assertEquals(7, result.size());
            
            // Missing day
            assertEquals(startDate, result.get(0).date());
            assertEquals(0, result.get(0).sessionsCompleted());
            
            // Present day
            assertEquals(startDate.plusDays(2), result.get(2).date());
            assertEquals(2, result.get(2).sessionsCompleted());
            assertEquals(3, result.get(2).timeSpentSeconds()); // ms -> s conversion
            assertEquals(15, result.get(2).questionsAnswered());
            assertEquals(250, result.get(2).xpEarned());
        }
    }
}
