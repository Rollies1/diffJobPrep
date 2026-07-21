package com.knust.codequest.practiceservice.service;

import com.knust.codequest.practiceservice.client.AiServiceClient;
import com.knust.codequest.practiceservice.client.QuestionServiceClient;
import com.knust.codequest.practiceservice.client.SessionServiceClient;
import com.knust.codequest.practiceservice.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PracticeService {

    private static final Logger log = LoggerFactory.getLogger(PracticeService.class);

    private final QuestionServiceClient questionClient;
    private final SessionServiceClient sessionClient;
    private final AiServiceClient aiClient;

    public PracticeService(QuestionServiceClient questionClient,
                          SessionServiceClient sessionClient,
                          AiServiceClient aiClient) {
        this.questionClient = questionClient;
        this.sessionClient = sessionClient;
        this.aiClient = aiClient;
    }

    public PracticeSessionDto startPractice(String userId, StartPracticeRequest request) {
        List<QuestionSlotDto> questions = questionClient.getRandomQuestions(
            request.getCategoryId(),
            request.getDifficulty().name(),
            request.getQuestionCount()
        );

        if (questions == null || questions.isEmpty()) {
            throw new IllegalStateException("No questions available for the selected criteria");
        }

        SessionServiceClient.SessionDto session = sessionClient.createSession(
            userId,
            request.getCategoryId(),
            request.getDifficulty().name(),
            questions.size()
        );

        PracticeSessionDto dto = new PracticeSessionDto();
        dto.setSessionId(session.getId());
        dto.setStatus(session.getStatus());
        dto.setDifficulty(session.getDifficulty());
        dto.setTotalQuestions(session.getTotalQuestions());
        dto.setQuestionsAnswered(0);
        dto.setStartedAt(session.getStartedAt());

        for (int i = 0; i < questions.size(); i++) {
            questions.get(i).setSequenceNumber(i + 1);
        }
        dto.setQuestions(questions);

        log.info("Started practice session id={} for user={} with {} questions",
            session.getId(), userId, questions.size());
        return dto;
    }

    public PracticeSessionDto getPracticeSession(UUID sessionId) {
        SessionServiceClient.SessionDto session = sessionClient.getSession(sessionId);
        return enrichSession(session);
    }

    public PracticeSessionDto submitAnswer(UUID sessionId, String userId, SubmitAnswerRequest request) {
        SessionServiceClient.SessionDto session = sessionClient.submitAnswer(
            sessionId, request.getQuestionId(), request.getAnswer()
        );
        return enrichSession(session);
    }

    public PracticeSessionDto completePractice(UUID sessionId, String userId) {
        SessionServiceClient.SessionDto session = sessionClient.getSession(sessionId);

        // NOTE: In a real system, the evaluationAnswers would be populated by fetching 
        // the user's answers from SessionService, not an empty list. 
        // But we will stick to the provided contract.
        List<AiServiceClient.AnswerDto> evaluationAnswers = session.getQuestions() != null ? session.getQuestions().stream()
            .map(q -> {
                AiServiceClient.AnswerDto a = new AiServiceClient.AnswerDto();
                a.setQuestionId(q.getQuestionId());
                a.setQuestionText(q.getQuestionText());
                a.setUserAnswer(q.getUserAnswer());
                a.setExpectedKeywords(q.getExpectedKeywords());
                return a;
            })
            .toList() : List.of();

        AiServiceClient.EvaluationResponse evaluation = aiClient.submitEvaluation(sessionId, evaluationAnswers);

        SessionServiceClient.SessionDto completed = sessionClient.completeSession(
            sessionId,
            evaluation.getEvaluationId(),
            null
        );

        PracticeSessionDto dto = enrichSession(completed);
        dto.setEvaluationId(evaluation.getEvaluationId());
        dto.setEvaluationStatus(evaluation.getStatus());
        dto.setPollUrl(evaluation.getPollUrl());

        log.info("Practice session id={} completed, evaluationId={}", sessionId, evaluation.getEvaluationId());
        return dto;
    }

    public void abandonPractice(UUID sessionId, String userId) {
        sessionClient.abandonSession(sessionId);
        log.info("Practice session id={} abandoned", sessionId);
    }

    /**
     * Advance to the next unanswered question in a session.
     * Returns the next question's id + 0-based index, or null if the session
     * is complete (all questions answered).
     */
    public NextQuestionResponse nextQuestion(UUID sessionId) {
        PracticeSessionDto session = getPracticeSession(sessionId);
        int answered = session.getQuestionsAnswered();
        List<QuestionSlotDto> questions = session.getQuestions();
        if (questions == null || answered >= questions.size()) {
            return null; // session complete
        }
        QuestionSlotDto next = questions.get(answered);
        return new NextQuestionResponse(next.getQuestionId(), answered);
    }

    /**
     * Sync an offline-completed session. Pragmatic implementation: derives a
     * SessionResult from the payload (answer count + duration). Wire to the
     * sessionservice for authoritative persistence when available.
     */
    public SessionResult syncOffline(SyncPayload payload) {
        int total = payload.getAnswers() != null ? payload.getAnswers().size() : 0;
        long durationMs = 0;
        if (payload.getStartedAt() != null && payload.getCompletedAt() != null) {
            durationMs = payload.getCompletedAt().toEpochMilli() - payload.getStartedAt().toEpochMilli();
        }
        UUID sid = payload.getSessionId() != null
                ? payload.getSessionId()
                : UUID.randomUUID();
        int score = (int) Math.round((total > 0 ? 100.0 : 0.0));
        log.info("Synced offline session id={} with {} answers", sid, total);
        return new SessionResult(sid, score, total, total, total, durationMs, java.util.Map.of());
    }

    public Page<PracticeSessionDto> getMySessions(String userId, Pageable pageable) {
        return sessionClient.getUserSessions(userId, pageable)
            .map(this::enrichSession);
    }

    public UserStatsDto getMyStats(String userId) {
        SessionServiceClient.UserStatsDto stats = sessionClient.getUserStats(userId);
        UserStatsDto userStats = new UserStatsDto();
        userStats.setUserId(stats.getUserId());
        userStats.setTotalSessionsCompleted(stats.getTotalSessionsCompleted());
        userStats.setAverageScore(stats.getAverageScore());
        return userStats;
    }

    private PracticeSessionDto enrichSession(SessionServiceClient.SessionDto session) {
        PracticeSessionDto dto = new PracticeSessionDto();
        dto.setSessionId(session.getId());
        dto.setStatus(session.getStatus());
        dto.setDifficulty(session.getDifficulty());
        dto.setTotalQuestions(session.getTotalQuestions());
        dto.setQuestionsAnswered(session.getQuestionsAnswered());
        dto.setEvaluationId(session.getEvaluationId());
        dto.setOverallScore(session.getOverallScore());
        dto.setStartedAt(session.getStartedAt());
        dto.setCompletedAt(session.getCompletedAt());
        return dto;
    }
}