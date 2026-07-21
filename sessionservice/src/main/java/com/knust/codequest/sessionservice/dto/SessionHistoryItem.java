package com.knust.codequest.sessionservice.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * One row in the session history list. Mirrors the frontend
 * {@code SessionHistoryItem} type 1:1.
 */
public class SessionHistoryItem {

    private UUID sessionId;
    private String deckId;
    private String deckName;
    private int score;
    private int totalQuestions;
    private int answeredQuestions;
    private long durationMs;
    private int xpEarned;
    private Instant completedAt;

    public SessionHistoryItem() {}

    public SessionHistoryItem(UUID sessionId, String deckId, String deckName, int score,
                              int totalQuestions, int answeredQuestions, long durationMs,
                              int xpEarned, Instant completedAt) {
        this.sessionId = sessionId;
        this.deckId = deckId;
        this.deckName = deckName;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.answeredQuestions = answeredQuestions;
        this.durationMs = durationMs;
        this.xpEarned = xpEarned;
        this.completedAt = completedAt;
    }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public String getDeckId() { return deckId; }
    public void setDeckId(String deckId) { this.deckId = deckId; }
    public String getDeckName() { return deckName; }
    public void setDeckName(String deckName) { this.deckName = deckName; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getAnsweredQuestions() { return answeredQuestions; }
    public void setAnsweredQuestions(int answeredQuestions) { this.answeredQuestions = answeredQuestions; }
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    public int getXpEarned() { return xpEarned; }
    public void setXpEarned(int xpEarned) { this.xpEarned = xpEarned; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
