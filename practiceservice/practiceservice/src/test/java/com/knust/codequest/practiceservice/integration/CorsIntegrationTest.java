package com.knust.codequest.practiceservice.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import com.knust.codequest.practiceservice.config.TestcontainersConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfig.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CorsIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private HttpHeaders headers;

    @BeforeEach
    void setUp() {
        headers = new HttpHeaders();
        headers.set("X-User-Id", "user123");
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://localhost:3000", "http://localhost:4200"})
    @DisplayName("Should allow preflight requests from configured origins")
    void corsPreflight_AllowedOrigins(String origin) {
        HttpHeaders preflightHeaders = new HttpHeaders();
        preflightHeaders.setOrigin(origin);
        preflightHeaders.setAccessControlRequestMethod(HttpMethod.POST);
        preflightHeaders.set("X-User-Id", "user123");

        HttpEntity<String> entity = new HttpEntity<>(preflightHeaders);

        ResponseEntity<String> response = restTemplate.exchange(
                "/practice/sessions",
                HttpMethod.OPTIONS,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).isEqualTo(origin);
    }

    @Test
    @DisplayName("Should reject preflight requests from unconfigured origins")
    void corsPreflight_UnconfiguredOrigin() {
        HttpHeaders preflightHeaders = new HttpHeaders();
        preflightHeaders.setOrigin("http://evil.com");
        preflightHeaders.setAccessControlRequestMethod(HttpMethod.POST);
        preflightHeaders.set("X-User-Id", "user123");

        HttpEntity<String> entity = new HttpEntity<>(preflightHeaders);

        ResponseEntity<String> response = restTemplate.exchange(
                "/practice/sessions",
                HttpMethod.OPTIONS,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://localhost:3000", "http://localhost:4200"})
    @DisplayName("Should allow actual requests from configured origins")
    void corsActualRequest_AllowedOrigins(String origin) {
        HttpHeaders actualHeaders = new HttpHeaders(headers);
        actualHeaders.setOrigin(origin);
        HttpEntity<String> entity = new HttpEntity<>(actualHeaders);

        ResponseEntity<String> response = restTemplate.exchange(
                "/practice/sessions",
                HttpMethod.POST,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).isEqualTo(origin);
        assertThat(response.getHeaders().getAccessControlAllowCredentials()).isTrue();
    }

    @Test
    @DisplayName("Should reject actual requests from unconfigured origins")
    void corsActualRequest_UnconfiguredOrigin() {
        HttpHeaders actualHeaders = new HttpHeaders(headers);
        actualHeaders.setOrigin("http://evil.com");
        HttpEntity<String> entity = new HttpEntity<>(actualHeaders);

        ResponseEntity<String> response = restTemplate.exchange(
                "/practice/sessions",
                HttpMethod.POST,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).isNull();
    }
}
