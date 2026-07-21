package com.knust.codequest.sessionservice;

import org.junit.jupiter.api.Test;
import com.knust.codequest.sessionservice.config.TestcontainersConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Import(TestcontainersConfig.class)
@SpringBootTest
@Testcontainers
class SessionserviceApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"));

    @Test
    void contextLoads() {
    }

    @Test
    void mainStartsApplication() {
        SessionserviceApplication.main(new String[] {
            "--spring.datasource.url=" + postgres.getJdbcUrl(),
            "--spring.datasource.username=" + postgres.getUsername(),
            "--spring.datasource.password=" + postgres.getPassword(),
            "--server.port=0" // Use random port to prevent conflicts
        });
    }
}
