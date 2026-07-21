package com.knust.codequest.practiceservice.dto;

import java.util.Map;
import java.util.UUID;

/**
 * Result of completing a practice session (online or offline-synced).
 * Mirrors the frontend {@code SessionResult} type 1:1.
 */
public class SessionResult {

    private UUID sessionId;
    private int score;
    private int totalQuestions;
    private int answeredQuestions;
    private int correctAnswers;
    private long durationMs;
    private Map<String, Integer> skillBreakdown;

    public SessionResult() {}

    public SessionResult(UUID sessionId, int score, int totalQuestions, int answeredQuestions,
                         int correctAnswers, long durationMs, Map<String, Integer> skillBreakdown) {
        this.sessionId = sessionId;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.answeredQuestions = answeredQuestions;
        this.correctAnswers = correctAnswers;
        this.durationMs = durationMs;
        this.skillBreakdown = skillBreakdown;
    }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getAnsweredQuestions() { return answeredQuestions; }
    public void setAnsweredQuestions(int answeredQuestions) { this.answeredQuestions = answeredQuestions; }
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    public Map<String, Integer> getSkillBreakdown() { return skillBreakdown; }
    public void setSkillBreakdown(Map<String, Integer> skillBreakdown) { this.skillBreakdown = skillBreakdown; }
}
