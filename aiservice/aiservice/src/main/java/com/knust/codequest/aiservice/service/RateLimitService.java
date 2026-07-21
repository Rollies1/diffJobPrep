package com.knust.codequest.aiservice.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Rate limit checker for evaluation endpoints.
 * <p>
 * Default in-memory implementation (single-node only).
 * For distributed deployments, activate {@code redis} profile to use
 * {@link RedisRateLimitService} instead.
 */
public interface RateLimitService {

    /**
     * Checks if the user can consume one evaluation token.
     *
     * @param userId the authenticated user ID (from JWT subject)
     * @return true if allowed, false if rate limit exceeded
     */
    boolean isAllowed(String userId);
}

/**
 * In-memory rate limiter for single-node deployments.
 */
@Service
@Profile("!redis")
class InMemoryRateLimitService implements RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(InMemoryRateLimitService.class);

    private final Map<String, Bucket> userBuckets;
    private final Bandwidth defaultBandwidth;

    public InMemoryRateLimitService(Map<String, Bucket> userBuckets, Bandwidth defaultBandwidth) {
        this.userBuckets = userBuckets;
        this.defaultBandwidth = defaultBandwidth;
    }

    @Override
    public boolean isAllowed(String userId) {
        Bucket bucket = userBuckets.computeIfAbsent(userId, k -> Bucket.builder()
            .addLimit(defaultBandwidth)
            .build());

        boolean allowed = bucket.tryConsume(1);
        if (!allowed) {
            log.warn("Rate limit exceeded for user={}", userId);
        }
        return allowed;
    }
}
