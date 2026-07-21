package com.knust.codequest.questionservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.questionservice.dto.*;
import com.knust.codequest.questionservice.service.QuestionService;
import com.knust.codequest.questionservice.service.SyncService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(QuestionController.class)
@AutoConfigureMockMvc(addFilters = false)
class QuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QuestionService queryService;

    @MockBean
    private SyncService syncService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getDecks_returns200() throws Exception {
        DeckDto deck = new DeckDto();
        deck.setId("java-basics");
        deck.setTitle("Java Basics");
        
        when(queryService.getAllDecks()).thenReturn(List.of(deck));

        mockMvc.perform(get("/questions/decks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("java-basics"));
    }

    @Test
    void getQuestions_returns200() throws Exception {
        QuestionDto q = new QuestionDto();
        q.setId("q1");
        q.setTitle("Title");

        PaginatedQuestionsResponse res = new PaginatedQuestionsResponse(List.of(q), "next-cursor");
        when(queryService.getQuestions(eq("deck1"), eq("cursor1"), eq(10), isNull(), isNull())).thenReturn(res);

        mockMvc.perform(get("/questions/decks/deck1/questions")
                .param("cursor", "cursor1")
                .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextCursor").value("next-cursor"))
                .andExpect(jsonPath("$.data[0].id").value("q1"));
    }

    @Test
    void getQuestion_returns200() throws Exception {
        QuestionDto q = new QuestionDto();
        q.setId("q1");
        
        when(queryService.getQuestion(eq("q1"), isNull(), isNull())).thenReturn(q);

        mockMvc.perform(get("/questions/q1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("q1"));
    }

    @Test
    void getCategories_returns200() throws Exception {
        when(queryService.getCategories()).thenReturn(List.of("Cat1", "Cat2"));

        mockMvc.perform(get("/questions/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("Cat1"));
    }

    @Test
    void sync_returns200() throws Exception {
        PendingActionDto action = new PendingActionDto();
        action.setActionId("a1");
        action.setQuestionId("q1");
        action.setType("BOOKMARK");

        SyncRequest req = new SyncRequest(
                Instant.now().toString(),
                List.of(action),
                "device1"
        );
        
        SyncResponse res = new SyncResponse(List.of("a1"), List.of(), Instant.now().toString());
        when(syncService.processBatch(eq("user1"), eq("device1"), any(SyncRequest.class))).thenReturn(res);

        mockMvc.perform(post("/questions/sync")
                .header("X-User-Id", "user1")
                .header("X-Device-Id", "device1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serverTimestamp").exists());
    }
}
