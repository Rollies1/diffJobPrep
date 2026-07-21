package com.jobprep.practice.repository;

import com.jobprep.practice.entity.IdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, String> {

    Optional<IdempotencyKey> findByUserIdAndKey(String userId, String key);

    /**
     * Race-safe insert using PostgreSQL's ON CONFLICT DO NOTHING.
     *
     * If the (userId, key) pair already exists, this returns 0 rows
     * (no insertion). The caller then reads the existing row to replay.
     *
     * This is a single atomic statement — no TOCTOU window, no
     * exception-catching. Superior to the catch-exception pattern.
     *
     * Returns 1 if the row was inserted (new key), 0 if it already existed.
     */
    @Modifying
    @Query(value = """
        INSERT INTO practice.idempotency_keys
            (id, user_id, key, request_hash, response_status, response_body,
             created_at, expires_at)
        VALUES
            (:id, :userId, :key, :requestHash, 0, '',
             NOW(), :expiresAt)
        ON CONFLICT (user_id, key) DO NOTHING
        """, nativeQuery = true)
    int insertIfAbsent(
        @Param("id") String id,
        @Param("userId") String userId,
        @Param("key") String key,
        @Param("requestHash") String requestHash,
        @Param("expiresAt") Instant expiresAt
    );

    /**
     * Update the stored response after the handler runs.
     */
    @Modifying
    @Query(value = """
        UPDATE practice.idempotency_keys
        SET response_status = :status,
            response_body = :body
        WHERE user_id = :userId AND key = :key
        """, nativeQuery = true)
    int updateResponse(
        @Param("userId") String userId,
        @Param("key") String key,
        @Param("status") int status,
        @Param("body") String body
    );

    /**
     * Delete the key if the handler failed — allows clean retry.
     */
    @Modifying
    @Query(value = """
        DELETE FROM practice.idempotency_keys
        WHERE user_id = :userId AND key = :key
        """, nativeQuery = true)
    int deleteByUserIdAndKey(@Param("userId") String userId, @Param("key") String key);

    /**
     * Prune expired keys (called by a scheduler or cron endpoint).
     */
    @Modifying
    @Query("DELETE FROM IdempotencyKey k WHERE k.expiresAt < :cutoff")
    int deleteByExpiresAtBefore(@Param("cutoff") Instant cutoff);
}
