package com.knust.codequest.questionservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Value("${server.port:8080}")
    private String port;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Question Bank API")
                        .version("1.0.0")
                        .description("Job prep question bank service for mobile app")
                        .contact(new Contact()
                                .name("CodeQuest Team")
                                .email("team@knust.edu.gh")))
                .servers(List.of(
                        new Server().url("http://localhost:" + port + contextPath)
                                  .description("Local development")
                ));
    }
}
