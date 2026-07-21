package com.knust.codequest.practiceservice.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import com.knust.codequest.practiceservice.config.TestcontainersConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.knust.codequest.practiceservice.service.PracticeSessionService;
import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.any;
import com.knust.codequest.practiceservice.model.dto.SessionState;
import com.knust.codequest.practiceservice.model.enums.SessionStatus;
import java.util.UUID;
@Import({TestcontainersConfig.class, com.knust.codequest.practiceservice.config.AppProperties.class})
@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PracticeSessionService practiceSessionService;

    @Test
    @DisplayName("Actuator health endpoint is permitted")
    void healthEndpoint_Permitted() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Practice endpoints without header return 403")
    void practiceEndpoint_WithoutHeader_Returns403() throws Exception {
        mockMvc.perform(get("/practice/sessions/" + UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Practice endpoints with header return 200")
    void practiceEndpoint_WithHeader_Returns200() throws Exception {
        Mockito.when(practiceSessionService.getSessionState(any(), any()))
               .thenReturn(new SessionState(UUID.randomUUID(), SessionStatus.IN_PROGRESS, "deck-1", 0, 10, java.util.Collections.emptyList(), java.time.Instant.now(), java.time.Instant.now().plusSeconds(3600), "MEDIUM"));
        mockMvc.perform(get("/practice/sessions/" + UUID.randomUUID())
                .header("X-User-Id", UUID.randomUUID().toString()))
                .andExpect(status().isOk());
    }
}
