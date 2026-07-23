package com.knust.codequest.questionservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * A curated deck of questions. Seeded by Flyway V4 with 70 decks across 14
 * categories. Each deck groups ~10 questions and is the unit the frontend
 * browses on the Library screens and starts practice sessions from.
 */
@Entity
@Table(name = "decks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(name = "color_hex", nullable = false)
    private String colorHex;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "question_count", nullable = false)
    private int questionCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
