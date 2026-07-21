package com.knust.codequest.sessionservice.controller;

import com.knust.codequest.sessionservice.model.dto.CursorPage;
import com.knust.codequest.sessionservice.model.dto.UserStats;
import com.knust.codequest.sessionservice.service.UserStatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SessionStatsController.class)
@AutoConfigureMockMvc(addFilters = false)
class SessionStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserStatsService userStatsService;

    private final UUID userId = UUID.randomUUID();

    @Test
    void getStats_withUserId_returns200() throws Exception {
        UserStats stats = new UserStats(1.0, 0.8, 5, 100, 5, 20, Map.of(), 500, 3, 50, 100, "Bronze");
        when(userStatsService.getStats(userId)).thenReturn(stats);

        mockMvc.perform(get("/sessions/stats")
                .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalXp").value(500))
                .andExpect(jsonPath("$.rankName").value("Bronze"));
    }

    @Test
    void getStats_withoutUserId_returns400() throws Exception {
        mockMvc.perform(get("/sessions/stats"))
                .andExpect(status().isBadRequest()); // Missing header returns 400
    }

    @Test
    void getHistory_withCursor_returns200() throws Exception {
        when(userStatsService.getHistory(eq(userId), eq("cursor123"), eq(10)))
                .thenReturn(new CursorPage<>(List.of(), "next123", true));

        mockMvc.perform(get("/sessions/history")
                .header("X-User-Id", userId.toString())
                .param("cursor", "cursor123")
                .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextCursor").value("next123"))
                .andExpect(jsonPath("$.hasMore").value(true));
    }

    @Test
    void getActivity_withDays_returns200() throws Exception {
        when(userStatsService.getActivity(eq(userId), eq(14)))
                .thenReturn(List.of());

        mockMvc.perform(get("/sessions/activity")
                .header("X-User-Id", userId.toString())
                .param("days", "14"))
                .andExpect(status().isOk());
    }
}
