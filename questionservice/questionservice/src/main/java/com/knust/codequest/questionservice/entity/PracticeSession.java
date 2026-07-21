package com.knust.codequest.questionservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
public class PracticeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "session_id")
    private UUID sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column
    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "time_spent_sec")
    private Integer timeSpentSec;

    @Column(length = 20)
    private String status = "in_progress";

    public PracticeSession(User user, Question question) {
        this.user = user;
        this.question = question;
        this.startedAt = LocalDateTime.now();
    }

    public void complete(String answer, Integer score, String feedback, Integer timeSpent) {
        this.userAnswer = answer;
        this.score = score;
        this.feedback = feedback;
        this.timeSpentSec = timeSpent;
        this.status = "completed";
        this.completedAt = LocalDateTime.now();
    }
}
