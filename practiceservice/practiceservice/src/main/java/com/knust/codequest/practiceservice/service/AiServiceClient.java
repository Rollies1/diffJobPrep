package com.knust.codequest.practiceservice.service;

import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
public class AiServiceClient {
    
    private final WebClient webClient;
    
    public AiServiceClient(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("http://aiservice:8084").build();
    }
    
    public Mono<EvaluationResponseDTO> submitEvaluation(EvaluationRequestDTO request) {
        return webClient.post()
            .uri("/api/ai/evaluations")
            .header("X-Service-Origin", "practiceservice")
            .header("Authorization", "Bearer " + getCurrentJwt())
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatusCode::is5xxServerError, 
                resp -> Mono.error(new RuntimeException("AI service unavailable")))
            .bodyToMono(EvaluationResponseDTO.class)
            .timeout(Duration.ofSeconds(15))
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)));
    }

    private String getCurrentJwt() {
        // In a real scenario, fetch this from SecurityContextHolder if in an HTTP thread,
        // or generate a server-to-server token using JwtUtil.
        return "a-very-long-dummy-secret-key-for-testing-purposes-only-12345"; 
    }

    public record EvaluationRequestDTO(
            String correlationId,
            LocalDateTime requestedAt,
            UUID sessionId,
            UUID userId,
            List<AnswerPayload> answers
    ) {}

    public record AnswerPayload(
            Long questionId,
            String questionText,
            List<String> expectedKeywords,
            String userAnswer,
            Integer durationSeconds
    ) {}

    public record EvaluationResponseDTO(
            String correlationId,
            LocalDateTime requestedAt,
            String evaluationId,
            String status,
            String pollUrl,
            Object result
    ) {}
}
