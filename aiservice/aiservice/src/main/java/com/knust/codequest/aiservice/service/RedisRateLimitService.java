package com.knust.codequest.aiservice.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis-backed rate limiter for distributed deployments.
 * <p>
 * Uses Bucket4j with Lettuce to store token buckets in Redis.
 * All service instances share the same bucket state per user.
 * <p>
 * Activate with profile {@code redis}. Falls back to in-memory
 * {@link RateLimitService} when redis profile is not active.
 */
@Service
@Profile("redis")
public class RedisRateLimitService implements RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimitService.class);

    private final ProxyManager<String> proxyManager;
    private final Bandwidth defaultBandwidth;

    public RedisRateLimitService(
            @Value("${spring.data.redis.host:localhost}") String redisHost,
            @Value("${spring.data.redis.port:6379}") int redisPort,
            @Value("${ai.rate-limit.evaluations-per-hour:5}") int evaluationsPerHour) {

        RedisClient redisClient = RedisClient.create("redis://" + redisHost + ":" + redisPort);
        StatefulRedisConnection<String, byte[]> connection = redisClient.connect();

        this.proxyManager = LettuceBasedProxyManager.builderFor(connection)
            .withExpirationStrategy(
                io.github.bucket4j.distributed.proxy.ExpirationAfterWriteStrategy
                    .basedOnTimeForRefillingBucketUpToMax(Duration.ofHours(1))
            )
            .build();

        this.defaultBandwidth = Bandwidth.classic(evaluationsPerHour,
            io.github.bucket4j.Refill.intervally(evaluationsPerHour, Duration.ofHours(1)));

        log.info("Redis rate limiter initialized: {} evals/hour per user", evaluationsPerHour);
    }

    @Override
    public boolean isAllowed(String userId) {
        Bucket bucket = proxyManager.builder()
            .build(userId, () -> BucketConfiguration.builder()
                .addLimit(defaultBandwidth)
                .build());

        boolean allowed = bucket.tryConsume(1);
        if (!allowed) {
            log.warn("Rate limit exceeded for user={}", userId);
        }
        return allowed;
    }
}
