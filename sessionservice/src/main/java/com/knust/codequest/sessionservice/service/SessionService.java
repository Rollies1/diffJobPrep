package com.knust.codequest.sessionservice.service;

import com.knust.codequest.sessionservice.config.SessionMapper;
import com.knust.codequest.sessionservice.config.AnswerMapper;
import com.knust.codequest.sessionservice.dto.*;
import com.knust.codequest.sessionservice.entity.PracticeSession;
import com.knust.codequest.sessionservice.entity.SessionAnswer;
import com.knust.codequest.sessionservice.repository.SessionRepository;
import com.knust.codequest.sessionservice.repository.AnswerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);

    private final SessionRepository sessionRepository;
    private final AnswerRepository answerRepository;
    private final SessionMapper sessionMapper;
    private final AnswerMapper answerMapper;

    public SessionService(SessionRepository sessionRepository,
                         AnswerRepository answerRepository,
                         SessionMapper sessionMapper,
                         AnswerMapper answerMapper) {
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.sessionMapper = sessionMapper;
        this.answerMapper = answerMapper;
    }

    @Transactional
    public SessionDto createSession(CreateSessionRequest request) {
        PracticeSession session = new PracticeSession();
        session.setUserId(request.getUserId());
        session.setCategoryId(request.getCategoryId());
        session.setDifficulty(PracticeSession.Difficulty.valueOf(request.getDifficulty().name()));
        session.setTotalQuestions(request.getTotalQuestions());

        PracticeSession saved = sessionRepository.save(session);
        log.info("Created session id={} for user={}", saved.getId(), request.getUserId());
        return sessionMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public SessionDto getSession(UUID sessionId) {
        PracticeSession session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
            .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        SessionDto dto = sessionMapper.toDto(session);
        dto.setAnswers(answerMapper.toDtoList(
            answerRepository.findBySessionIdOrderBySequenceNumberAsc(sessionId)
        ));
        return dto;
    }

    @Transactional
    public SessionDto submitAnswer(UUID sessionId, SubmitAnswerRequest request) {
        PracticeSession session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
            .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        if (session.getStatus() != PracticeSession.Status.IN_PROGRESS) {
            throw new IllegalStateException("Session is not in progress: " + session.getStatus());
        }

        if (answerRepository.existsBySessionIdAndQuestionId(sessionId, request.getQuestionId())) {
            throw new IllegalStateException("Answer already submitted for this question");
        }

        SessionAnswer answer = new SessionAnswer();
        answer.setSessionId(sessionId);
        answer.setQuestionId(request.getQuestionId());
        answer.setUserAnswer(request.getAnswer());
        answer.setSequenceNumber(session.getQuestionsAnswered() + 1);
        answerRepository.save(answer);

        session.setQuestionsAnswered(session.getQuestionsAnswered() + 1);
        sessionRepository.save(session);

        log.info("Answer submitted for session id={} question={}", sessionId, request.getQuestionId());
        return getSession(sessionId);
    }

    @Transactional
    public SessionDto completeSession(UUID sessionId, CompleteSessionRequest request) {
        PracticeSession session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
            .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        if (session.getStatus() != PracticeSession.Status.IN_PROGRESS) {
            throw new IllegalStateException("Session already completed or abandoned");
        }

        session.setStatus(PracticeSession.Status.COMPLETED);
        session.setCompletedAt(Instant.now());
        session.setEvaluationId(request.getEvaluationId());
        session.setOverallScore(request.getOverallScore());
        sessionRepository.save(session);

        log.info("Session id={} completed, evaluationId={}", sessionId, request.getEvaluationId());
        return getSession(sessionId);
    }

    @Transactional
    public void abandonSession(UUID sessionId) {
        PracticeSession session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
            .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        session.setStatus(PracticeSession.Status.ABANDONED);
        session.setCompletedAt(Instant.now());
        sessionRepository.save(session);
        log.info("Session id={} abandoned", sessionId);
    }

    @Transactional(readOnly = true)
    public Page<SessionDto> getUserSessions(String userId, Pageable pageable) {
        return sessionRepository.findByUserIdAndDeletedAtIsNull(userId, pageable)
            .map(sessionMapper::toDto);
    }

    @Transactional(readOnly = true)
    public UserStatsDto getUserStats(String userId) {
        long completed = sessionRepository.countCompletedByUser(userId);
        Double avgScore = sessionRepository.averageScoreByUser(userId);

        // Enriched stats — derive what we can from practice_sessions.
        List<PracticeSession> completedSessions = sessionRepository
                .findByUserIdAndStatusAndDeletedAtIsNull(userId, PracticeSession.Status.COMPLETED);

        long totalAnswered = completedSessions.stream().mapToLong(PracticeSession::getQuestionsAnswered).sum();

        Instant weekAgo = Instant.now().minusSeconds(7 * 24 * 3600L);
        int weeklySessions = (int) completedSessions.stream()
                .filter(s -> s.getCompletedAt() != null && s.getCompletedAt().isAfter(weekAgo))
                .count();

        int streakDays = computeStreak(userId);
        double completionRate = completed > 0
                ? (avgScore != null ? avgScore : 0.0)
                : 0.0;

        return UserStatsDto.derived(userId, totalAnswered, weeklySessions, streakDays, completionRate);
    }

    /** Cursor-paginated completed-session history, newest first. */
    @Transactional(readOnly = true)
    public CursorPage<SessionHistoryItem> getHistory(String userId, String cursor, int limit) {
        int size = Math.min(Math.max(limit, 1), 100);
        PageRequest page = PageRequest.of(0, size + 1); // fetch one extra to detect hasMore

        List<PracticeSession> sessions;
        if (cursor == null || cursor.isBlank()) {
            sessions = sessionRepository.findByUserIdAndStatusAndDeletedAtIsNullOrderByIdDesc(
                    userId, PracticeSession.Status.COMPLETED, page);
        } else {
            UUID cursorId = UUID.fromString(cursor);
            sessions = sessionRepository.findByUserIdAndStatusAndDeletedAtIsNullAndIdLessThanOrderByIdDesc(
                    userId, PracticeSession.Status.COMPLETED, cursorId, page);
        }

        boolean hasMore = sessions.size() > size;
        if (hasMore) sessions = sessions.subList(0, size);

        List<SessionHistoryItem> items = sessions.stream()
                .map(this::toHistoryItem)
                .collect(Collectors.toList());

        String nextCursor = hasMore && !items.isEmpty()
                ? items.get(items.size() - 1).getSessionId().toString()
                : null;

        return new CursorPage<>(items, nextCursor, hasMore);
    }

    /** Daily activity for the last N days. */
    @Transactional(readOnly = true)
    public List<DailyActivityDto> getActivity(String userId, int days) {
        int span = Math.min(Math.max(days, 1), 90);
        Instant since = Instant.now().minusSeconds((long) span * 24 * 3600);
        List<PracticeSession> sessions = sessionRepository.findCompletedSince(userId, since);

        Map<LocalDate, List<PracticeSession>> byDay = sessions.stream()
                .filter(s -> s.getCompletedAt() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate()));

        List<DailyActivityDto> out = new ArrayList<>();
        for (int i = span - 1; i >= 0; i--) {
            LocalDate day = LocalDate.now(ZoneOffset.UTC).minusDays(i);
            List<PracticeSession> daySessions = byDay.getOrDefault(day, List.of());
            int sessionsCount = daySessions.size();
            int questions = daySessions.stream().mapToInt(PracticeSession::getQuestionsAnswered).sum();
            long secs = daySessions.stream()
                    .filter(s -> s.getStartedAt() != null && s.getCompletedAt() != null)
                    .mapToLong(s -> (s.getCompletedAt().getEpochSecond() - s.getStartedAt().getEpochSecond()))
                    .sum();
            double scoreSum = daySessions.stream()
                    .map(PracticeSession::getOverallScore)
                    .filter(Objects::nonNull)
                    .mapToDouble(BigDecimal::doubleValue)
                    .sum();
            int xp = questions * 10;
            out.add(new DailyActivityDto(day, sessionsCount, questions, secs, scoreSum, xp));
        }
        return out;
    }

    private SessionHistoryItem toHistoryItem(PracticeSession s) {
        long durationMs = (s.getStartedAt() != null && s.getCompletedAt() != null)
                ? (s.getCompletedAt().toEpochMilli() - s.getStartedAt().toEpochMilli())
                : 0;
        int score = s.getOverallScore() != null ? s.getOverallScore().intValue() : 0;
        int xp = s.getQuestionsAnswered() * 10;
        return new SessionHistoryItem(
                s.getId(),
                s.getCategoryId() != null ? s.getCategoryId().toString() : null,
                null, // deckName not tracked at this layer
                score,
                s.getTotalQuestions(),
                s.getQuestionsAnswered(),
                durationMs,
                xp,
                s.getCompletedAt()
        );
    }

    private int computeStreak(String userId) {
        List<java.sql.Date> days = sessionRepository.findDistinctCompletedDays(userId);
        if (days.isEmpty()) return 0;
        int streak = 0;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (java.sql.Date d : days) {
            LocalDate day = d.toLocalDate();
            if (day.equals(today.minusDays(streak))) {
                streak++;
            } else if (day.isAfter(today.minusDays(streak))) {
                continue; // future same-day, skip
            } else {
                break; // gap
            }
        }
        return streak;
    }

    @Transactional
    public void deleteSession(UUID sessionId) {
        PracticeSession session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
            .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));
        session.setDeletedAt(Instant.now());
        sessionRepository.save(session);
        log.info("Soft-deleted session id={}", sessionId);
    }

    public static class SessionNotFoundException extends RuntimeException {
        public SessionNotFoundException(String message) { super(message); }
    }
}
