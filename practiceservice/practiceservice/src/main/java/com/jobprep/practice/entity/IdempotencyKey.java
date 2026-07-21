package com.jobprep.practice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Idempotency key record — separate table, NOT a column on session_answers.
 *
 * Per review:
 *   - Separate table keeps domain tables clean.
 *   - TTL via expiresAt — old keys cleaned by a scheduler.
 *   - requestHash detects "same key, different payload" → 409 Conflict.
 *   - Unique on (userId, key) — race-condition safe via DB constraint.
 *   - responseBody stores the JSON to replay on duplicate requests.
 *
 * Race safety:
 *   PostgreSQL's INSERT ... ON CONFLICT (user_id, key) DO NOTHING is a
 *   single atomic statement. If two concurrent requests with the same
 *   key race, exactly one INSERT succeeds; the other gets 0 rows and
 *   falls through to the SELECT to read the existing response.
 */
@Entity
@Table(
    name = "idempotency_keys",
    schema = "practice",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_key", columnNames = {"user_id", "key"})
    },
    indexes = {
        @Index(name = "idx_idem_expires", columnList = "expires_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdempotencyKey {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "key", nullable = false, length = 128)
    private String key;

    /** SHA-256 of the canonical request body — detects payload mismatch. */
    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    /** HTTP status to replay (e.g. 201, 200). */
    @Column(name = "response_status", nullable = false)
    private int responseStatus;

    /** JSON-serialized response body to replay. */
    @Column(name = "response_body", nullable = false, columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
