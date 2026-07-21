package com.knust.codequest.practiceservice.service;

import com.knust.codequest.practiceservice.dto.ReadinessScoreResponse;
import com.knust.codequest.practiceservice.dto.StartSessionRequest;
import com.knust.codequest.practiceservice.dto.SubmitAnswerRequest;
import com.knust.codequest.practiceservice.dto.SubmitAnswerResponse;
import com.knust.codequest.practiceservice.entity.PracticeSession;
import com.knust.codequest.practiceservice.entity.UserAnswer;
import com.knust.codequest.practiceservice.repository.PracticeSessionRepository;
import com.knust.codequest.practiceservice.repository.UserAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PracticeService {

    private static final Logger log = LoggerFactory.getLogger(PracticeService.class);
    private static final String AI_SERVICE_URL = "https://jobprep-ai-2-0-1.onrender.com/api/ai/evaluate";
    private static final String QUESTION_SERVICE_URL = "https://jobprep-questions-2-0-1.onrender.com/api/questions";

    private final PracticeSessionRepository sessionRepository;
    private final UserAnswerRepository answerRepository;
    private final WebClient.Builder webClientBuilder;

    public PracticeSession startSession(StartSessionRequest request) {
        PracticeSession session = new PracticeSession();
        session.setUserId(request.getUserId());
        session.setCategoryId(request.getCategoryId());
        return sessionRepository.save(session);
    }

    public SubmitAnswerResponse submitAnswer(SubmitAnswerRequest request) {
        if (request.getSessionId() == null) {
            throw new IllegalArgumentException("sessionId cannot be null");
        }
        if (request.getQuestionId() == null) {
            throw new IllegalArgumentException("questionId cannot be null");
        }

        PracticeSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found: " + request.getSessionId()));

        UserAnswer answer = new UserAnswer();
        answer.setSession(session);
        answer.setQuestionId(request.getQuestionId());
        answer.setAnswer(request.getAnswer());

        // Fetch sample answer from question-service
        String sampleAnswer = "";
        try {
            Map questionData = webClientBuilder.build()
                    .get()
                    .uri(QUESTION_SERVICE_URL + "/" + request.getQuestionId())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
            if (questionData != null && questionData.get("sampleAnswer") != null) {
                sampleAnswer = questionData.get("sampleAnswer").toString();
            }
            log.info("Fetched sample answer for question {}", request.getQuestionId());
        } catch (Exception e) {
            log.warn("Could not fetch sample answer: {}", e.getMessage());
        }

        // Call AI service
        try {
            Map<String, Object> aiRequest = Map.of(
                    "question", request.getQuestion() != null ? request.getQuestion() : "",
                    "answer", request.getAnswer() != null ? request.getAnswer() : "",
                    "category", request.getCategory() != null ? request.getCategory() : ""
            );

            log.info("Calling AI service with payload: {}", aiRequest);

            Map response = webClientBuilder.build()
                    .post()
                    .uri(AI_SERVICE_URL)
                    .bodyValue(aiRequest)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(60))
                    .retryWhen(Retry.fixedDelay(2, Duration.ofSeconds(3))
                            .filter(throwable -> {
                                log.warn("AI service call failed, retrying: {}", throwable.getMessage());
                                return true;
                            }))
                    .block();

            log.info("AI service response: {}", response);

            if (response != null) {
                try {
                    answer.setAiFeedback(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(response));
                } catch (Exception ex) {
                    answer.setAiFeedback(response.toString());
                }
                answer.setAiScore(response.get("score") != null ?
                        Double.parseDouble(response.get("score").toString()) : 0.0);
            }
        } catch (Exception e) {
            log.error("Failed to call AI service", e);
            answer.setAiFeedback("AI evaluation unavailable");
            answer.setAiScore(0.0);
        }

        UserAnswer saved = answerRepository.save(answer);

        return new SubmitAnswerResponse(
                saved.getId(),
                saved.getQuestionId(),
                saved.getAnswer(),
                saved.getAiFeedback(),
                saved.getAiScore(),
                sampleAnswer
        );
    }

    public List<PracticeSession> getHistory(Long userId) {
        return sessionRepository.findByUserId(userId);
    }

    public List<UserAnswer> getAnswersBySession(Long sessionId) {
        return answerRepository.findBySessionId(sessionId);
    }

    public ReadinessScoreResponse getReadinessScore(Long userId) {
        List<PracticeSession> sessions = sessionRepository.findByUserId(userId);
        int totalSessions = sessions.size();

        if (totalSessions == 0) {
            return new ReadinessScoreResponse(0, 0.0, 0.0);
        }

        List<UserAnswer> allAnswers = sessions.stream()
                .flatMap(session -> answerRepository.findBySessionId(session.getId()).stream())
                .toList();

        double averageScore = allAnswers.isEmpty() ? 0.0 :
                allAnswers.stream()
                        .mapToDouble(a -> a.getAiScore() != null ? a.getAiScore() : 0.0)
                        .average()
                        .orElse(0.0);

        double readinessPercentage = Math.min((averageScore / 10) * 100, 100);

        return new ReadinessScoreResponse(totalSessions, averageScore, readinessPercentage);
    }
}