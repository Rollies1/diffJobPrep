package com.knust.codequest.practiceservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.practiceservice.exception.QuestionNotFoundException;
import com.knust.codequest.practiceservice.model.dto.NextQuestionResponse;
import com.knust.codequest.practiceservice.model.entity.PracticeSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdaptiveQuestionSelectorTest {

    @Mock
    private WebClient.Builder webClientBuilder;

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    private ObjectMapper objectMapper = new ObjectMapper();

    private AdaptiveQuestionSelector selector;

    @BeforeEach
    void setUp() {
        selector = new AdaptiveQuestionSelector(webClientBuilder, objectMapper);
    }

    private void mockWebClientGetFlux(List<AdaptiveQuestionSelector.QuestionMetadata> responseList) {
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(ArgumentMatchers.<Function>any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToFlux(AdaptiveQuestionSelector.QuestionMetadata.class)).thenReturn(Flux.fromIterable(responseList));
    }

    @Test
    void selectInitialQueue_adaptiveTrue_stratifiesByDifficulty() {
        List<AdaptiveQuestionSelector.QuestionMetadata> all = new ArrayList<>();
        for (int i = 0; i < 10; i++) all.add(new AdaptiveQuestionSelector.QuestionMetadata(UUID.randomUUID(), "EASY", "cat", null));
        for (int i = 0; i < 10; i++) all.add(new AdaptiveQuestionSelector.QuestionMetadata(UUID.randomUUID(), "MEDIUM", "cat", null));
        for (int i = 0; i < 10; i++) all.add(new AdaptiveQuestionSelector.QuestionMetadata(UUID.randomUUID(), "HARD", "cat", null));

        mockWebClientGetFlux(all);

        List<UUID> queue = selector.selectInitialQueue("cat", 10, true, UUID.randomUUID());
        assertEquals(10, queue.size());
    }

    @Test
    void selectInitialQueue_adaptiveFalse_randomStratified() {
        List<AdaptiveQuestionSelector.QuestionMetadata> all = new ArrayList<>();
        for (int i = 0; i < 10; i++) all.add(new AdaptiveQuestionSelector.QuestionMetadata(UUID.randomUUID(), "EASY", "cat", null));
        for (int i = 0; i < 10; i++) all.add(new AdaptiveQuestionSelector.QuestionMetadata(UUID.randomUUID(), "MEDIUM", "cat", null));
        for (int i = 0; i < 10; i++) all.add(new AdaptiveQuestionSelector.QuestionMetadata(UUID.randomUUID(), "HARD", "cat", null));

        mockWebClientGetFlux(all);

        List<UUID> queue = selector.selectInitialQueue("cat", 10, false, UUID.randomUUID());
        assertEquals(10, queue.size());
    }

    @Test
    void selectInitialQueue_emptyList_throwsException() {
        mockWebClientGetFlux(List.of());
        assertThrows(IllegalStateException.class, () -> selector.selectInitialQueue("cat", 10, true, UUID.randomUUID()));
    }

    @Test
    void adaptQueueAfterAnswer_adaptiveFalse_doesNothing() {
        PracticeSession session = new PracticeSession();
        session.setAdaptive(false);
        selector.adaptQueueAfterAnswer(session, true);
        assertEquals("MEDIUM", session.getCurrentDifficulty());
    }

    @Test
    void adaptQueueAfterAnswer_correctEasy_becomesMedium() {
        PracticeSession session = new PracticeSession();
        session.setAdaptive(true);
        session.setCurrentDifficulty("EASY");
        session.setCurrentQuestionIndex(0);
        session.setTotalQuestions(3);
        session.setQuestionQueue(new ArrayList<>(List.of(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID())));

        mockWebClientGetFlux(List.of(
                new AdaptiveQuestionSelector.QuestionMetadata(session.getQuestionQueue().get(1), "MEDIUM", "cat", null),
                new AdaptiveQuestionSelector.QuestionMetadata(session.getQuestionQueue().get(2), "EASY", "cat", null)
        ));

        selector.adaptQueueAfterAnswer(session, true);

        assertEquals("MEDIUM", session.getCurrentDifficulty());
    }

    @Test
    void fetchQuestion_found_returnsMappedDto() {
        UUID id = UUID.randomUUID();
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), eq(id))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        
        AdaptiveQuestionSelector.QuestionDto dto = new AdaptiveQuestionSelector.QuestionDto(id, "Title", "Content", "HARD", "Hint", "cat");
        when(responseSpec.bodyToMono(AdaptiveQuestionSelector.QuestionDto.class)).thenReturn(Mono.just(dto));

        NextQuestionResponse.QuestionDto result = selector.fetchQuestion(id);
        assertEquals(id, result.id());
        assertEquals("Title", result.title());
    }

    @Test
    void fetchQuestion_empty_throwsException() {
        UUID id = UUID.randomUUID();
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), eq(id))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(AdaptiveQuestionSelector.QuestionDto.class)).thenReturn(Mono.empty());

        assertThrows(QuestionNotFoundException.class, () -> selector.fetchQuestion(id));
    }

    @Test
    void gradeAnswerInternally_returnsTrue() {
        UUID id = UUID.randomUUID();
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), eq(id))).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(Boolean.class)).thenReturn(Mono.just(true));

        boolean res = selector.gradeAnswerInternally(id, null, "answer");
        assertTrue(res);
    }
}
