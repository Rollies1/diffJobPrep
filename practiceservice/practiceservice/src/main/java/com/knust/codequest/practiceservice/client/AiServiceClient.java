package com.knust.codequest.practiceservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class AiServiceClient {

    private final WebClient webClient;
    private final String serviceSecret;

    public AiServiceClient(WebClient.Builder builder,
                           @Value("${services.ai.base-url}") String aiBaseUrl,
                           @Value("${services.shared-secret}") String serviceSecret) {
        this.webClient = builder.baseUrl(aiBaseUrl).build();
        this.serviceSecret = serviceSecret;
    }

    public EvaluationResponse submitEvaluation(UUID sessionId, List<AnswerDto> answers) {
        EvaluationRequest request = new EvaluationRequest();
        request.setCorrelationId(UUID.randomUUID());
        request.setSessionId(sessionId);
        request.setRequestedAt(Instant.now());
        request.setAnswers(answers);

        return webClient.post()
            .uri("/api/ai/evaluations")
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", serviceSecret)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(EvaluationResponse.class)
            .block();
    }

    public static class EvaluationRequest {
        private UUID correlationId;
        private UUID sessionId;
        private Instant requestedAt;
        private List<AnswerDto> answers;
        public UUID getCorrelationId() { return correlationId; }
        public void setCorrelationId(UUID correlationId) { this.correlationId = correlationId; }
        public UUID getSessionId() { return sessionId; }
        public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
        public Instant getRequestedAt() { return requestedAt; }
        public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
        public List<AnswerDto> getAnswers() { return answers; }
        public void setAnswers(List<AnswerDto> answers) { this.answers = answers; }
    }

    public static class EvaluationResponse {
        private UUID evaluationId;
        private String status;
        private String pollUrl;
        public UUID getEvaluationId() { return evaluationId; }
        public void setEvaluationId(UUID evaluationId) { this.evaluationId = evaluationId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getPollUrl() { return pollUrl; }
        public void setPollUrl(String pollUrl) { this.pollUrl = pollUrl; }
    }

    public static class AnswerDto {
        private UUID questionId;
        private String questionText;
        private String userAnswer;
        private List<String> expectedKeywords;
        public UUID getQuestionId() { return questionId; }
        public void setQuestionId(UUID questionId) { this.questionId = questionId; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getUserAnswer() { return userAnswer; }
        public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
        public List<String> getExpectedKeywords() { return expectedKeywords; }
        public void setExpectedKeywords(List<String> expectedKeywords) { this.expectedKeywords = expectedKeywords; }
    }
}
