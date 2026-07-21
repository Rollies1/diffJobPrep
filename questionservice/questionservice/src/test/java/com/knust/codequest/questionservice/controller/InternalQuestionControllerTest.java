package com.knust.codequest.questionservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.questionservice.dto.GradeRequest;
import com.knust.codequest.questionservice.service.QuestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@WebMvcTest(InternalQuestionController.class)
@AutoConfigureMockMvc(addFilters = false)
class InternalQuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QuestionService questionService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void gradeQuestion_returnsTrue() throws Exception {
        when(questionService.gradeQuestion(eq("q1"), any(GradeRequest.class))).thenReturn(true);

        GradeRequest req = new GradeRequest(1, null);

        mockMvc.perform(post("/internal/questions/q1/grade")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void gradeQuestion_returnsFalse() throws Exception {
        when(questionService.gradeQuestion(eq("q1"), any(GradeRequest.class))).thenReturn(false);

        GradeRequest req = new GradeRequest(null, "wrong answer");

        mockMvc.perform(post("/internal/questions/q1/grade")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }
}
