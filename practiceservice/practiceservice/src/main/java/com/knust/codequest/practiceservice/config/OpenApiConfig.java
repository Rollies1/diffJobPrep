package com.knust.codequest.practiceservice.config;

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

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Practice Service API")
                        .version("1.0.0")
                        .description("Interview practice session execution layer")
                        .contact(new Contact().name("CodeQuest Team").email("team@knust.edu.gh")))
                .servers(List.of(
                        new Server().url("http://localhost:8083" + contextPath).description("Local development")
                ));
    }
}
