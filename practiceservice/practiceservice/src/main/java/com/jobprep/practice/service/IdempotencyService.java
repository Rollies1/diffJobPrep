package com.jobprep.practice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobprep.practice.config.IdempotencyProperties;
import com.jobprep.practice.entity.IdempotencyKey;
import com.jobprep.practice.repository.IdempotencyKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Race-safe idempotency wrapper.
 *
 * Per review:
 *   - Separate IdempotencyKey table — does not pollute domain tables.
 *   - Unique on (userId, key) — race-condition safe via DB constraint.
 *   - TTL via expiresAt — old keys cleaned by a scheduler.
 *   - requestHash mismatch returns 409 (catches client bugs).
 *   - Replay returns the original status + body, plus an
 *     Idempotent-Replay: true header (set by the controller).
 *
 * Race safety:
 *   Uses PostgreSQL's INSERT ... ON CONFLICT DO NOTHING — a single
 *   atomic statement. If two concurrent requests with the same key
 *   race, exactly one INSERT returns 1 row (winner); the other returns
 *   0 rows (loser) and falls through to the replay branch. No TOCTOU
 *   window, no exception-catching.
 *
 * Usage:
 *   var result = idempotencyService.execute(userId, key, body, () -> {
 *       // ... do the real work ...
 *       return new IdempotentResult<>(201, responseBody);
 *   });
 *   // result.replayed() → true if this was a replay
 *   // result.conflict() → true if same key + different payload (409)
 *   // result.status() / result.body() → the response to return
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyKeyRepository keyRepo;
    private final IdempotencyProperties props;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public <T> IdempotentResult<T> execute(
        String userId,
        String key,
        Object requestBody,
        Supplier<IdempotentResult<T>> handler
    ) {
        // 1. Validate key.
        if (key == null || key.isBlank() || key.length() > props.getMaxKeyLength()) {
            return IdempotentResult.error(400, "invalid_idempotency_key");
        }

        String requestHash = hashRequestBody(requestBody);
        Instant expiresAt = Instant.now().plusSeconds(props.getTtlHours() * 3600L);

        // 2. Race-safe INSERT ... ON CONFLICT DO NOTHING.
        int inserted = keyRepo.insertIfAbsent(
            UUID.randomUUID().toString(),
            userId,
            key,
            requestHash,
            expiresAt
        );

        if (inserted == 0) {
            // 3. Key already exists — check payload hash.
            Optional<IdempotencyKey> existing = keyRepo.findByUserIdAndKey(userId, key);
            if (existing.isEmpty()) {
                // Extremely unlikely race: row vanished between INSERT and SELECT.
                return IdempotentResult.error(409, "idempotency_key_inconsistent");
            }

            IdempotencyKey row = existing.get();
            if (!row.getRequestHash().equals(requestHash)) {
                // Same key, different payload — client bug. 409.
                return IdempotentResult.conflict("idempotency_key_reuse_with_different_payload");
            }

            // 4. Exact replay.
            T body = parseBody(row.getResponseBody());
            return IdempotentResult.replay(row.getResponseStatus(), body);
        }

        // 5. Key claimed — run the real handler.
        try {
            IdempotentResult<T> result = handler.get();

            String responseBodyStr;
            try {
                responseBodyStr = objectMapper.writeValueAsString(result.body());
            } catch (com.fasterxml.jackson.core.JsonProcessingException jpe) {
                throw new RuntimeException("Failed to serialize response", jpe);
            }

            // 6. Store the response for future replays.
            keyRepo.updateResponse(
                userId,
                key,
                result.status(),
                responseBodyStr
            );

            return result;
        } catch (Exception e) {
            // Handler failed — release the key so the client can retry.
            log.warn("Handler failed for key={}: {}", key, e.getMessage());
            keyRepo.deleteByUserIdAndKey(userId, key);
            throw e;
        }
    }

    /**
     * Prune expired keys. Called by a scheduler or the cron endpoint.
     */
    @Transactional
    public int pruneExpired() {
        return keyRepo.deleteByExpiresAtBefore(Instant.now());
    }

    @SuppressWarnings("unchecked")
    private <T> T parseBody(String json) {
        try {
            return (T) objectMapper.readValue(json, Object.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse stored idempotency response: {}", e.getMessage());
            return null;
        }
    }

    /**
     * SHA-256 of the canonical JSON request body.
     */
    private String hashRequestBody(Object body) {
        try {
            String json = objectMapper.writeValueAsString(body);
            byte[] hash = MessageDigest.getInstance("SHA-256")
                .digest(json.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash request body", e);
        }
    }

    /**
     * Result of an idempotent operation.
     */
    public record IdempotentResult<T>(int status, T body, boolean replayed, boolean conflict) {
        public static <T> IdempotentResult<T> success(int status, T body) {
            return new IdempotentResult<>(status, body, false, false);
        }

        public static <T> IdempotentResult<T> replay(int status, T body) {
            return new IdempotentResult<>(status, body, true, false);
        }

        @SuppressWarnings("unchecked")
        public static <T> IdempotentResult<T> conflict(String message) {
            return new IdempotentResult<T>(409, (T) message, false, true);
        }

        @SuppressWarnings("unchecked")
        public static <T> IdempotentResult<T> error(int status, String message) {
            return new IdempotentResult<T>(status, (T) message, false, false);
        }
    }
}
