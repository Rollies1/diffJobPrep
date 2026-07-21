package com.knust.codequest.questionservice.controller;

import com.knust.codequest.questionservice.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WithMockUser(username = "testuser", roles = {"USER"})
class QuestionControllerIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnFilteredQuestions() throws Exception {
        mockMvc.perform(get("/questions")
                        .param("role", "Software Engineer")
                        .param("level", "New Grad")
                        .param("topic", "Algorithms")
                        .param("difficulty", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].content").value("Test coding question?"))
                .andExpect(jsonPath("$.content[0].difficulty").value(2));
    }

    @Test
    void shouldSearchQuestionsWithCaseInsensitiveMatch() throws Exception {
        mockMvc.perform(get("/questions/search")
                        .param("q", "BEHAVIORAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].content").value("Test behavioral question?"));
    }

    @Test
    void shouldReturnQuestionById() throws Exception {
        mockMvc.perform(get("/questions/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Test behavioral question?"))
                .andExpect(jsonPath("$.difficulty").value(1));
    }

    @Test
    void shouldReturn404ForUnknownQuestion() throws Exception {
        mockMvc.perform(get("/questions/00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Question not found with id: '00000000-0000-0000-0000-000000000000'"));
    }

    @Test
    void shouldReturnUnmasteredQuestions() throws Exception {
        mockMvc.perform(get("/questions/unmastered")
                        .param("userId", "11111111-1111-1111-1111-111111111111")
                        .param("role", "Software Engineer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
