package com.knust.codequest.sessionservice.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.knust.codequest.sessionservice.config.TestcontainersConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfig.class)
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.session.max-questions=100",
        "app.session.default-difficulty=MEDIUM",
        "app.session.completion-timeout-minutes=60",
        "app.cors.allowed-origins=http://localhost:3000,http://localhost:4200",
        "app.cors.max-age=3600",
        "app.security.user-id-header=X-User-Id",
        "app.logging.include-correlation-id=true"
})
class ConfigurationPropertiesTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:15-alpine"));

    @Autowired
    private AppProperties appProperties;

    @Test
    @DisplayName("Should load session max questions from properties")
    void sessionMaxQuestions_Loaded() {
        assertThat(appProperties.getSession().getMaxQuestions()).isEqualTo(100);
    }

    @Test
    @DisplayName("Should load default difficulty from properties")
    void defaultDifficulty_Loaded() {
        assertThat(appProperties.getSession().getDefaultDifficulty()).isEqualTo("MEDIUM");
    }

    @Test
    @DisplayName("Should load completion timeout from properties")
    void completionTimeout_Loaded() {
        assertThat(appProperties.getSession().getCompletionTimeoutMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("Should load CORS allowed origins from properties")
    void corsAllowedOrigins_Loaded() {
        assertThat(appProperties.getCors().getAllowedOrigins())
                .containsExactly("http://localhost:3000", "http://localhost:4200");
    }

    @Test
    @DisplayName("Should load CORS max age from properties")
    void corsMaxAge_Loaded() {
        assertThat(appProperties.getCors().getMaxAge()).isEqualTo(3600);
    }

    @Test
    @DisplayName("Should load security user ID header from properties")
    void securityUserIdHeader_Loaded() {
        assertThat(appProperties.getSecurity().getUserIdHeader()).isEqualTo("X-User-Id");
    }

    @Test
    @DisplayName("Should load logging correlation ID setting from properties")
    void loggingCorrelationId_Loaded() {
        assertThat(appProperties.getLogging().isIncludeCorrelationId()).isTrue();
    }
}
