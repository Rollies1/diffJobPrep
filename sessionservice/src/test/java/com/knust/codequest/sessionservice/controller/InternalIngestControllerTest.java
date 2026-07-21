package com.knust.codequest.sessionservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.knust.codequest.sessionservice.model.dto.SessionCompletedEvent;
import com.knust.codequest.sessionservice.service.SessionIngestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalIngestController.class)
@AutoConfigureMockMvc(addFilters = false)
class InternalIngestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SessionIngestService ingestService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    private SessionCompletedEvent buildValidEvent() {
        return new SessionCompletedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "deck-123",
                100,
                List.of(),
                60000,
                Instant.now()
        );
    }

    @Test
    void ingest_validEvent_returns200() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/internal/ingest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildValidEvent())))
                .andExpect(status().isOk());
    }

    @Test
    void ingest_missingSessionId_returns400() throws Exception {
        SessionCompletedEvent invalidEvent = new SessionCompletedEvent(
                null,
                UUID.randomUUID(),
                "deck-123",
                100,
                List.of(),
                60000,
                Instant.now()
        );

        mockMvc.perform(post("/api/v1/sessions/internal/ingest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidEvent)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ingest_blankDeckId_returns400() throws Exception {
        SessionCompletedEvent invalidEvent = new SessionCompletedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "   ",
                100,
                List.of(),
                60000,
                Instant.now()
        );

        mockMvc.perform(post("/api/v1/sessions/internal/ingest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidEvent)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ingest_negativeScore_returns400() throws Exception {
        SessionCompletedEvent invalidEvent = new SessionCompletedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "deck-123",
                -10, // negative score
                List.of(),
                60000,
                Instant.now()
        );

        mockMvc.perform(post("/api/v1/sessions/internal/ingest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidEvent)))
                .andExpect(status().isBadRequest());
    }
}
