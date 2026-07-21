package com.knust.codequest.practiceservice.integration;

import com.knust.codequest.practiceservice.config.TestcontainersConfig;
import com.knust.codequest.practiceservice.model.dto.StartSessionRequest.SessionConfig;
import com.knust.codequest.practiceservice.model.dto.SessionState;
import com.knust.codequest.practiceservice.model.dto.StartSessionRequest;
import com.knust.codequest.practiceservice.model.enums.SessionStatus;
import com.knust.codequest.practiceservice.service.AdaptiveQuestionSelector;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfig.class)
class PracticeSessionIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @MockBean
    private AdaptiveQuestionSelector questionSelector;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Test
    void startAndGetSession_happyPath() {
        UUID userId = UUID.randomUUID();
        when(questionSelector.selectInitialQueue(any(), anyInt(), anyBoolean(), any()))
                .thenReturn(List.of(UUID.randomUUID(), UUID.randomUUID()));

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());

        StartSessionRequest req = new StartSessionRequest("deck-123", new SessionConfig(10, null, true));
        HttpEntity<StartSessionRequest> request = new HttpEntity<>(req, headers);

        // Start session
        ResponseEntity<SessionState> startResponse = restTemplate.postForEntity(
                "/practice/sessions", request, SessionState.class);

        assertEquals(201, startResponse.getStatusCode().value());
        SessionState state = startResponse.getBody();
        assertNotNull(state);
        assertNotNull(state.id());
        assertEquals(SessionStatus.IN_PROGRESS, state.status());
        assertEquals(2, state.totalQuestions());

        // Get state
        ResponseEntity<SessionState> getResponse = restTemplate.exchange(
                "/practice/sessions/" + state.id(), HttpMethod.GET, new HttpEntity<>(headers), SessionState.class);
        
        assertEquals(200, getResponse.getStatusCode().value());
        assertNotNull(getResponse.getBody());
        assertEquals(state.id(), getResponse.getBody().id());
    }
}
