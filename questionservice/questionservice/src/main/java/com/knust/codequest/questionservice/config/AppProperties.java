package com.knust.codequest.questionservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {

    private final Cors cors = new Cors();

    @Data
    public static class Cors {
        private String[] allowedOrigins = {"*"};
        private String[] allowedMethods = {"GET", "POST", "PUT", "DELETE", "OPTIONS"};
        private String[] allowedHeaders = {"*"};
        private long maxAge = 3600;
    }
}
