package com.jobprep.practice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "practice_sessions",
    schema = "practice",
    indexes = {
        @Index(name = "idx_session_user", columnList = "user_id"),
        @Index(name = "idx_session_started", columnList = "started_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeSession {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "topic", length = 128)
    private String topic;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    /** Streak count at the time the session started (for delta calc). */
    @Column(name = "streak_at_start")
    @Builder.Default
    private int streakAtStart = 0;

    @PrePersist
    void prePersist() {
        if (startedAt == null) startedAt = Instant.now();
    }
}
