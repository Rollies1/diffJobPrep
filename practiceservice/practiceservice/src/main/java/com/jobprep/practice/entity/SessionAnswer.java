package com.jobprep.practice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "session_answers",
    schema = "practice",
    indexes = {
        @Index(name = "idx_answer_session", columnList = "session_id"),
        @Index(name = "idx_answer_question", columnList = "question_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionAnswer {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "session_id", nullable = false, length = 36)
    private String sessionId;

    @Column(name = "question_id", nullable = false, length = 128)
    private String questionId;

    @Column(name = "question_text", nullable = false, length = 1024)
    private String questionText;

    @Column(name = "selected_option", nullable = false, length = 256)
    private String selectedOption;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "answered_at", nullable = false)
    private Instant answeredAt;

    @PrePersist
    void prePersist() {
        if (answeredAt == null) answeredAt = Instant.now();
    }
}
