package com.jobprep.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Audit log for every push notification sent.
 *
 * Used for:
 *   - De-duplication (sessionservice checks "did we already send a
 *     streak_reminder to this user today?")
 *   - Observability (success/failure counts over time)
 *   - Receipt correlation (Expo returns a ticket ID per push; we later
 *     fetch the receipt to confirm delivery)
 */
@Entity
@Table(
    name = "notification_logs",
    schema = "notification",
    indexes = {
        @Index(name = "idx_notif_user_type_sent", columnList = "user_id,type,sent_at"),
        @Index(name = "idx_notif_sent", columnList = "sent_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /** "streak_reminder" | "test" | "ai_answer" | ... */
    @Column(name = "type", nullable = false, length = 32)
    private String type;

    @Column(name = "title", nullable = false, length = 256)
    private String title;

    @Column(name = "body", nullable = false, length = 1024)
    private String body;

    /** "sent" | "failed" | "rejected" */
    @Column(name = "status", nullable = false, length = 16)
    private String status;

    /** Expo ticket ID (for receipt correlation). */
    @Column(name = "expo_ticket_id", length = 128)
    private String expoTicketId;

    @Column(name = "error_details", length = 1024)
    private String errorDetails;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @PrePersist
    void prePersist() {
        if (sentAt == null) sentAt = Instant.now();
    }
}
