package com.knust.codequest.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A registered Expo push token for a user's device.
 *
 * Per review:
 *   - Unique on (userId, deviceId) → upsert on re-registration.
 *   - `isActive` for opt-out / soft delete (preserves audit trail).
 *   - `timezone` (IANA) for tz-aware scheduling — never send at 3am local.
 *   - `locale` for i18n of reminder copy.
 *   - `token` is a bearer credential — treat as secret; don't log it.
 *   - `lastUsedAt` for pruning stale tokens.
 */
@Entity
@Table(
    name = "device_tokens",
    schema = "notification",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_device", columnNames = {"user_id", "device_id"}),
        @UniqueConstraint(name = "uk_token", columnNames = {"token"})
    },
    indexes = {
        @Index(name = "idx_device_tokens_user", columnList = "user_id"),
        @Index(name = "idx_device_tokens_active", columnList = "is_active")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceToken {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /** Expo push token — bearer credential, max 512 chars. */
    @Column(name = "token", nullable = false, length = 512)
    private String token;

    /** "ios" | "android" | "web" */
    @Column(name = "platform", nullable = false, length = 16)
    private String platform;

    /** Client-supplied stable device ID (e.g. IDFV / Android ID). */
    @Column(name = "device_id", nullable = false, length = 128)
    private String deviceId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    /** IANA timezone, e.g. "Africa/Accra". */
    @Column(name = "timezone", nullable = false, length = 64)
    @Builder.Default
    private String timezone = "UTC";

    @Column(name = "locale", nullable = false, length = 16)
    @Builder.Default
    private String locale = "en";

    @Column(name = "app_version", length = 32)
    private String appVersion;

    @Column(name = "os_version", length = 32)
    private String osVersion;

    @Column(name = "registered_at", nullable = false)
    private Instant registeredAt;

    @Column(name = "last_used_at", nullable = false)
    private Instant lastUsedAt;

    @PrePersist
    void prePersist() {
        if (registeredAt == null) registeredAt = Instant.now();
        if (lastUsedAt == null) lastUsedAt = Instant.now();
    }
}
