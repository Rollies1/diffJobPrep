package com.jobprep.session.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Tracks each user's practice streak.
 *
 * A streak is "active" when the user practiced at least once in the last
 * 24-48 hours (the exact grace window is a product decision). The
 * scheduler uses this to decide who to remind.
 *
 * NOTE: In a real system this row would be updated by practiceservice
 * when the user submits an answer. For simplicity, sessionservice owns
 * a read-only view (or you replicate via events). The schema here is
 * the canonical source of truth for "current streak count".
 */
@Entity
@Table(
    name = "user_streaks",
    schema = "session",
    indexes = {
        @Index(name = "idx_streak_active", columnList = "is_active"),
        @Index(name = "idx_streak_user", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStreak {

    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    /** Current consecutive-day streak count. */
    @Column(name = "streak_count", nullable = false)
    @Builder.Default
    private int streakCount = 0;

    /** Date of the last practice session (in the user's local tz). */
    @Column(name = "last_practice_date")
    private LocalDate lastPracticeDate;

    /** Whether the streak is currently active (>0 and within grace window). */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
