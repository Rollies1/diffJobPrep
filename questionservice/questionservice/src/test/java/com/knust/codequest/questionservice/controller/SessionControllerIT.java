package com.knust.codequest.questionservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.questionservice.AbstractIntegrationTest;
import com.knust.codequest.questionservice.dto.CompleteSessionRequest;
import com.knust.codequest.questionservice.dto.StartSessionRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WithMockUser(username = "testuser", roles = {"USER"})
class SessionControllerIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TEST_USER_ID = "11111111-1111-1111-1111-111111111111";

    @Test
    void shouldReturnUserProgressByTopic() throws Exception {
        mockMvc.perform(get("/sessions/progress")
                        .param("userId", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].topic").value("Leadership"))
                .andExpect(jsonPath("$[0].questionsAttempted").value(1))
                .andExpect(jsonPath("$[0].avgScore").value(85.0));
    }

    @Test
    void shouldReturnRecentCompletedSessions() throws Exception {
        mockMvc.perform(get("/sessions/recent")
                        .param("userId", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].status").value("completed"))
                .andExpect(jsonPath("$[0].score").value(85))
                .andExpect(jsonPath("$[0].questionContent").value("Test behavioral question?"));
    }

    @Test
    void shouldStartNewSession() throws Exception {
        StartSessionRequest request = new StartSessionRequest();
        request.setUserId(java.util.UUID.fromString(TEST_USER_ID));
        request.setQuestionId(java.util.UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"));

        mockMvc.perform(post("/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(TEST_USER_ID))
                .andExpect(jsonPath("$.questionId").value("cccccccc-cccc-cccc-cccc-cccccccccccc"))
                .andExpect(jsonPath("$.status").value("in_progress"))
                .andExpect(jsonPath("$.completedAt").doesNotExist());
    }

    @Test
    void shouldCompleteExistingSession() throws Exception {
        CompleteSessionRequest request = new CompleteSessionRequest();
        request.setAnswer("My completed answer");
        request.setScore(90);
        request.setFeedback("Great improvement");
        request.setTimeSpent(200);

        mockMvc.perform(patch("/sessions/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.score").value(90))
                .andExpect(jsonPath("$.timeSpentSec").value(200))
                .andExpect(jsonPath("$.completedAt").exists());
    }

    @Test
    void shouldReturn400ForInvalidCompleteRequest() throws Exception {
        CompleteSessionRequest request = new CompleteSessionRequest();
        request.setAnswer(""); // invalid: blank
        request.setScore(150); // invalid: > 100
        request.setFeedback("test");
        request.setTimeSpent(0); // invalid: < 1

        mockMvc.perform(patch("/sessions/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Validation failed")));
    }

    @Test
    void shouldReturn404WhenCompletingUnknownSession() throws Exception {
        CompleteSessionRequest request = new CompleteSessionRequest();
        request.setAnswer("test");
        request.setScore(50);
        request.setFeedback("test");
        request.setTimeSpent(100);

        mockMvc.perform(patch("/sessions/00000000-0000-0000-0000-000000000000/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Session not found with id: '00000000-0000-0000-0000-000000000000'"));
    }
}
