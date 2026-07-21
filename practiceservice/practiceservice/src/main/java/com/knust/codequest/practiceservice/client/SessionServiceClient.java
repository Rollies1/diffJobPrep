package com.knust.codequest.practiceservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.UUID;

@Component
public class SessionServiceClient {

    private final WebClient webClient;
    private final String serviceSecret;

    public SessionServiceClient(WebClient.Builder builder,
                                @Value("${services.session.base-url}") String sessionBaseUrl,
                                @Value("${services.shared-secret}") String serviceSecret) {
        this.webClient = builder.baseUrl(sessionBaseUrl).build();
        this.serviceSecret = serviceSecret;
    }

    public SessionDto createSession(String userId, UUID categoryId, String difficulty, int totalQuestions) {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setUserId(userId);
        request.setCategoryId(categoryId);
        request.setDifficulty(CreateSessionRequest.Difficulty.valueOf(difficulty));
        request.setTotalQuestions(totalQuestions);

        return webClient.post()
            .uri("/api/sessions")
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(SessionDto.class)
            .block();
    }

    public SessionDto getSession(UUID sessionId) {
        return webClient.get()
            .uri("/api/sessions/{id}", sessionId)
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .retrieve()
            .bodyToMono(SessionDto.class)
            .block();
    }

    public SessionDto submitAnswer(UUID sessionId, UUID questionId, String answer) {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setUserResponse(answer);

        return webClient.post()
            .uri("/api/sessions/{id}/answers", sessionId)
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(SessionDto.class)
            .block();
    }

    public SessionDto completeSession(UUID sessionId, UUID evaluationId, java.math.BigDecimal overallScore) {
        CompleteSessionRequest request = new CompleteSessionRequest();
        request.setEvaluationId(evaluationId);
        request.setOverallScore(overallScore);

        return webClient.post()
            .uri("/api/sessions/{id}/complete", sessionId)
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(SessionDto.class)
            .block();
    }

    public void abandonSession(UUID sessionId) {
        webClient.post()
            .uri("/api/sessions/{id}/abandon", sessionId)
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .retrieve()
            .toBodilessEntity()
            .block();
    }

    public Page<SessionDto> getUserSessions(String userId, org.springframework.data.domain.Pageable pageable) {
        return webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/sessions")
                .queryParam("userId", userId)
                .queryParam("page", pageable.getPageNumber())
                .queryParam("size", pageable.getPageSize())
                .build())
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Page<SessionDto>>() {})
            .block();
    }

    public UserStatsDto getUserStats(String userId) {
        return webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/sessions/stats")
                .queryParam("userId", userId)
                .build())
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .retrieve()
            .bodyToMono(UserStatsDto.class)
            .block();
    }

    // Inner DTOs
    public static class CreateSessionRequest {
        private String userId;
        private UUID categoryId;
        private Difficulty difficulty;
        private int totalQuestions;
        public enum Difficulty { EASY, MEDIUM, HARD }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
        public Difficulty getDifficulty() { return difficulty; }
        public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }
        public int getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    }

    public static class SubmitAnswerRequest {
        private UUID questionId;
        private String userResponse;
        public UUID getQuestionId() { return questionId; }
        public void setQuestionId(UUID questionId) { this.questionId = questionId; }
        public String getUserResponse() { return userResponse; }
        public void setUserResponse(String userResponse) { this.userResponse = userResponse; }
    }

    public static class CompleteSessionRequest {
        private UUID evaluationId;
        private java.math.BigDecimal overallScore;
        public UUID getEvaluationId() { return evaluationId; }
        public void setEvaluationId(UUID evaluationId) { this.evaluationId = evaluationId; }
        public java.math.BigDecimal getOverallScore() { return overallScore; }
        public void setOverallScore(java.math.BigDecimal overallScore) { this.overallScore = overallScore; }
    }

    public static class SessionDto {
        private UUID id;
        private String userId;
        private String status;
        private UUID categoryId;
        private String difficulty;
        private int totalQuestions;
        private int questionsAnswered;
        private UUID evaluationId;
        private java.math.BigDecimal overallScore;
        private java.time.Instant startedAt;
        private java.time.Instant completedAt;
        private java.util.List<SessionQuestionDto> questions;
        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public int getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
        public int getQuestionsAnswered() { return questionsAnswered; }
        public void setQuestionsAnswered(int questionsAnswered) { this.questionsAnswered = questionsAnswered; }
        public UUID getEvaluationId() { return evaluationId; }
        public void setEvaluationId(UUID evaluationId) { this.evaluationId = evaluationId; }
        public java.math.BigDecimal getOverallScore() { return overallScore; }
        public void setOverallScore(java.math.BigDecimal overallScore) { this.overallScore = overallScore; }
        public java.time.Instant getStartedAt() { return startedAt; }
        public void setStartedAt(java.time.Instant startedAt) { this.startedAt = startedAt; }
        public java.time.Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(java.time.Instant completedAt) { this.completedAt = completedAt; }
        public java.util.List<SessionQuestionDto> getQuestions() { return questions; }
        public void setQuestions(java.util.List<SessionQuestionDto> questions) { this.questions = questions; }
    }

    public static class SessionQuestionDto {
        private UUID questionId;
        private String questionText;
        private String userAnswer;
        private java.util.List<String> expectedKeywords;
        public UUID getQuestionId() { return questionId; }
        public void setQuestionId(UUID questionId) { this.questionId = questionId; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getUserAnswer() { return userAnswer; }
        public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
        public java.util.List<String> getExpectedKeywords() { return expectedKeywords; }
        public void setExpectedKeywords(java.util.List<String> expectedKeywords) { this.expectedKeywords = expectedKeywords; }
    }

    public static class UserStatsDto {
        private String userId;
        private long totalSessionsCompleted;
        private double averageScore;
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public long getTotalSessionsCompleted() { return totalSessionsCompleted; }
        public void setTotalSessionsCompleted(long totalSessionsCompleted) { this.totalSessionsCompleted = totalSessionsCompleted; }
        public double getAverageScore() { return averageScore; }
        public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
    }
}
