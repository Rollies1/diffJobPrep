package com.knust.codequest.practiceservice.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.knust.codequest.practiceservice.config.TestcontainersConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfig.class)
@SpringBootTest
@TestPropertySource(properties = {
        "app.cors.allowed-origins=http://localhost:3000,http://localhost:4200",
        "ai-service.url=http://custom-ai-service"
})
class ConfigurationPropertiesTest {

    @Autowired
    private AppProperties appProperties;

    @Test
    @DisplayName("Should load CORS properties from environment")
    void shouldLoadCorsProperties() {
        assertThat(appProperties.getCors().getAllowedOrigins())
                .isNotNull()
                .hasSize(2)
                .containsExactlyElementsOf(List.of("http://localhost:3000", "http://localhost:4200"));
    }
}
