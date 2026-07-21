package com.knust.codequest.practiceservice.client;

import com.knust.codequest.practiceservice.dto.QuestionSlotDto;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.UUID;

@Component
public class QuestionServiceClient {

    private final WebClient webClient;

    public QuestionServiceClient(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("http://questionservice:8080").build();
    }

    public List<QuestionSlotDto> getRandomQuestions(UUID categoryId, String difficulty, int count) {
        return webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/questions/random")
                .queryParam("categoryId", categoryId)
                .queryParam("difficulty", difficulty)
                .queryParam("count", count)
                .build())
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", "${SERVICE_SHARED_SECRET}")
            .retrieve()
            .bodyToFlux(QuestionSlotDto.class)
            .collectList()
            .block();
    }

    public QuestionSlotDto getQuestion(UUID questionId) {
        return webClient.get()
            .uri("/api/questions/{id}", questionId)
            .header("X-Service-Origin", "practiceservice")
            .header("X-Service-Secret", "${SERVICE_SHARED_SECRET}")
            .retrieve()
            .bodyToMono(QuestionSlotDto.class)
            .block();
    }
}
