package com.knust.codequest.sessionservice.service;

import com.knust.codequest.sessionservice.config.SessionMapper;
import com.knust.codequest.sessionservice.config.AnswerMapper;
import com.knust.codequest.sessionservice.dto.*;
import com.knust.codequest.sessionservice.model.PracticeSession;
import com.knust.codequest.sessionservice.model.SessionAnswer;
import com.knust.codequest.sessionservice.repository.SessionRepository;
import com.knust.codequest.sessionservice.repository.AnswerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

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

        UserStatsDto stats = new UserStatsDto();
        stats.setUserId(userId);
        stats.setTotalSessionsCompleted(completed);
        stats.setAverageScore(avgScore != null ? avgScore.doubleValue() : 0.0);
        return stats;
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
