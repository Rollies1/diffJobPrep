package com.jobprep.session.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "services")
public class ServiceUrls {

    private ServiceConfig notification = new ServiceConfig();

    @Data
    public static class ServiceConfig {
        private String baseUrl;
        private String apiKey;
    }
}
