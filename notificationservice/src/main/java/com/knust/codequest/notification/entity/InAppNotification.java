package com.knust.codequest.notification.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * In-app notification message (the "message center").
 *
 * Messages are addressed either to a specific user (audience=USER,
 * userId set) or to everyone (audience in {BROADCAST, SYSTEM, DEV},
 * userId null). The mobile app's home bell + Notifications screen
 * read from this table.
 *
 * Read receipts are per-row: `readAt` is null until the user opens
 * the notification. For broadcast rows, this means read state is
 * shared across users — that's intentional for v1 (the inbox is
 * short-lived; expiry handles cleanup). A future revision can move
 * read-state to a per-user join table if needed.
 */
@Entity
@Table(
    name = "in_app_notifications",
    schema = "notification",
    indexes = {
        @Index(name = "idx_inapp_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_inapp_audience_created", columnList = "audience, created_at")
    }
)
public class InAppNotification {

    @Id
    @Column(name = "id")
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID id;

    /** Null means broadcast to everyone. */
    @Column(name = "user_id", length = 64)
    private String userId;

    /** "USER" | "BROADCAST" | "SYSTEM" | "DEV". */
    @Column(name = "audience", nullable = false, length = 16)
    private String audience;

    /** "system" | "dev" | "tutor" | "achievement" | "streak" | "deck" | ... */
    @Column(name = "type", nullable = false, length = 64)
    private String type;

    @Column(name = "title", nullable = false, length = 256)
    private String title;

    @Column(name = "body", nullable = false, length = 1024)
    private String body;

    @Column(name = "emoji", length = 32)
    private String emoji;

    @Column(name = "avatar", length = 64)
    private String avatar;

    /** Call-to-action label, e.g. "Open deck". */
    @Column(name = "cta", length = 64)
    private String cta;

    /** Deep-link screen name, e.g. "library", "practice". */
    @Column(name = "target_screen", length = 64)
    private String targetScreen;

    /** JSON string of deep-link params. */
    @Column(name = "target_params", columnDefinition = "text")
    private String targetParams;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getCta() { return cta; }
    public void setCta(String cta) { this.cta = cta; }

    public String getTargetScreen() { return targetScreen; }
    public void setTargetScreen(String targetScreen) { this.targetScreen = targetScreen; }

    public String getTargetParams() { return targetParams; }
    public void setTargetParams(String targetParams) { this.targetParams = targetParams; }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
