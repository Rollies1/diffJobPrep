package com.knust.codequest.sessionservice.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import com.knust.codequest.sessionservice.config.TestcontainersConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import({TestcontainersConfig.class, AppProperties.class})
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SecurityConfigTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"));

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("OPTIONS requests should be permitted")
    void optionsRequestsArePermitted() throws Exception {
        mockMvc.perform(options("/sessions/stats"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Without X-User-Id header, requests are forbidden/unauthorized")
    void withoutHeaderIsForbidden() throws Exception {
        // Since we don't pass X-User-Id, the filter won't set auth, so it gets rejected
        mockMvc.perform(get("/sessions/stats?userId=123e4567-e89b-12d3-a456-426614174000"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("With X-User-Id header, request proceeds to controller")
    void withHeaderIsAllowed() throws Exception {
        // With the header, the filter authenticates.
        // We expect 200 OK since mockMvc hits the real controller 
        mockMvc.perform(get("/sessions/stats")
                        .header("X-User-Id", "123e4567-e89b-12d3-a456-426614174000"))
                .andExpect(status().isOk());
    }
}
