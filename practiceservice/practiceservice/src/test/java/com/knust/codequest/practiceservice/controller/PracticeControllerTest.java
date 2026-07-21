package com.knust.codequest.practiceservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.knust.codequest.practiceservice.exception.SessionNotFoundException;
import com.knust.codequest.practiceservice.model.dto.*;
import com.knust.codequest.practiceservice.model.enums.SessionStatus;
import com.knust.codequest.practiceservice.service.PracticeSessionService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PracticeController.class)
@AutoConfigureMockMvc(addFilters = false)
class PracticeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PracticeSessionService sessionService;

    private ObjectMapper objectMapper;

    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void startSession_returns201() throws Exception {
        StartSessionRequest req = new StartSessionRequest("deck-1", new StartSessionRequest.SessionConfig(10, null, true));
        SessionState state = new SessionState(sessionId, SessionStatus.IN_PROGRESS, "deck-1", 0, 10, java.util.List.of(), Instant.now(), Instant.now(), "EASY");
        
        when(sessionService.startSession(eq(userId), any())).thenReturn(state);

        mockMvc.perform(post("/practice/sessions")
                .header("X-User-Id", userId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(sessionId.toString()));
    }

    @Test
    void getState_returns200() throws Exception {
        SessionState state = new SessionState(sessionId, SessionStatus.IN_PROGRESS, "deck-1", 0, 10, java.util.List.of(), Instant.now(), Instant.now(), "EASY");
        when(sessionService.getSessionState(sessionId, userId)).thenReturn(state);

        mockMvc.perform(get("/practice/sessions/" + sessionId)
                .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk());
    }

    @Test
    void submitAnswer_returns200() throws Exception {
        SubmitAnswerRequest req = new SubmitAnswerRequest("ans", 1000, true, null);
        SubmitAnswerResponse res = new SubmitAnswerResponse(true, true);
        
        when(sessionService.submitAnswer(eq(sessionId), eq(userId), any())).thenReturn(res);

        mockMvc.perform(post("/practice/sessions/" + sessionId + "/answers")
                .header("X-User-Id", userId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accepted").value(true));
    }

    @Test
    void nextQuestion_returns200() throws Exception {
        NextQuestionResponse res = new NextQuestionResponse(true, new NextQuestionResponse.QuestionDto(UUID.randomUUID(), "title", "content", "EASY", "hint", "cat"), "EASY");
        when(sessionService.nextQuestion(sessionId, userId)).thenReturn(res);

        mockMvc.perform(post("/practice/sessions/" + sessionId + "/next")
                .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasMore").value(true));
    }

    @Test
    void completeSession_returns200() throws Exception {
        SessionResult res = new SessionResult(sessionId, 100, 10, 8, 8, 5000, java.util.Map.of());
        when(sessionService.completeSession(sessionId, userId)).thenReturn(res);

        mockMvc.perform(post("/practice/sessions/" + sessionId + "/complete")
                .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(100));
    }

    @Test
    void abandonSession_returns204() throws Exception {
        mockMvc.perform(post("/practice/sessions/" + sessionId + "/abandon")
                .header("X-User-Id", userId.toString()))
                .andExpect(status().isNoContent());
    }

    @Test
    void syncOfflineSession_returns200() throws Exception {
        SyncPayload req = new SyncPayload(
                "client-1", "deck-1", Instant.now(), Instant.now(), 
                List.of(new SyncPayload.SessionAnswerPayload(UUID.randomUUID(), 1, "text", 1000))
        );
        SessionResult res = new SessionResult(sessionId, 100, 1, 1, 1, 1000, java.util.Map.of());
        
        when(sessionService.syncOfflineSession(eq(userId), any())).thenReturn(res);

        mockMvc.perform(post("/practice/sync")
                .header("X-User-Id", userId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }
}
