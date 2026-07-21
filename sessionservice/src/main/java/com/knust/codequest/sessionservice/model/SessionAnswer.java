package com.knust.codequest.sessionservice.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "session_answers", indexes = {
    @Index(name = "idx_answers_session", columnList = "session_id")
})
public class SessionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, name = "session_id")
    private UUID sessionId;

    @Column(nullable = false, name = "question_id")
    private UUID questionId;

    @Column(nullable = false, name = "sequence_number")
    private int sequenceNumber;

    @Column(nullable = false, length = 5000, name = "user_answer")
    private String userAnswer;

    @Column(nullable = false, name = "answered_at")
    private Instant answeredAt;

    @Column(nullable = false, updatable = false, name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.answeredAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public int getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(int sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }

    public Instant getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(Instant answeredAt) { this.answeredAt = answeredAt; }

    public Instant getCreatedAt() { return createdAt; }
}
