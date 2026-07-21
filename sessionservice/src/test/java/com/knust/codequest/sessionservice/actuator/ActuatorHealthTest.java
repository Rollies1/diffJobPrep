package com.knust.codequest.sessionservice.actuator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import com.knust.codequest.sessionservice.config.TestcontainersConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(TestcontainersConfig.class)
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class ActuatorHealthTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:15-alpine"));

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Health endpoint should return UP when DB is available")
    void healthEndpoint_DbUp_ReturnsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", org.hamcrest.Matchers.is("UP")));
    }

    @Test
    @DisplayName("Info endpoint should return application info")
    void infoEndpoint_ReturnsAppInfo() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Metrics endpoint should be available")
    void metricsEndpoint_Available() throws Exception {
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.names", org.hamcrest.Matchers.notNullValue()));
    }

    @Test
    @DisplayName("HTTP server requests metrics should be available")
    void metricsHttpServerRequests_Available() throws Exception {
        mockMvc.perform(get("/actuator/metrics/http.server.requests"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("JVM memory metrics should be available")
    void metricsJvmMemory_Available() throws Exception {
        mockMvc.perform(get("/actuator/metrics/jvm.memory.used"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", org.hamcrest.Matchers.is("jvm.memory.used")));
    }

    @Test
    @DisplayName("Health endpoint should not require authentication")
    void healthEndpoint_NoAuth_ReturnsOk() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }
}
