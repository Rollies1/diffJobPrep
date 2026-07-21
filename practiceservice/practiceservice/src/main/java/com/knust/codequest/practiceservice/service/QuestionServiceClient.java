package com.knust.codequest.practiceservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Component
public class QuestionServiceClient {

    private final WebClient webClient;

    public QuestionServiceClient(@Value("${question.service.url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public List<QuestionDTO> fetchQuestionsByTopic(String topicName, String roleName) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/questions")
                        .queryParam("topic", topicName)
                        .queryParam("role", roleName)
                        .build())
                .retrieve()
                .bodyToFlux(QuestionDTO.class)
                .collectList()
                .block();
    }

    public record QuestionDTO(
        Long questionId,
        String content,
        String modelAnswer,
        Integer difficulty,
        Integer timeSeconds,
        String source,
        String companyTag,
        String language
    ) {}
}
