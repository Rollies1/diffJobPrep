package com.knust.codequest.aiservice.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-user rate limiting configuration using Bucket4j.
 * <p>
 * Prevents token abuse by limiting evaluations per user per hour.
 * Default: 5 evaluations per user per hour.
 */
@Configuration
public class RateLimitConfig {

    @Bean
    public Map<String, Bucket> userBuckets() {
        return new ConcurrentHashMap<>();
    }

    @Bean
    public Bandwidth defaultBandwidth() {
        return Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1)));
    }
}
