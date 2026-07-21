package com.knust.codequest.questionservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final AppProperties appProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(appProperties.getCors().getAllowedOrigins())
                .allowedMethods(appProperties.getCors().getAllowedMethods())
                .allowedHeaders(appProperties.getCors().getAllowedHeaders())
                .maxAge(appProperties.getCors().getMaxAge());
    }
}
