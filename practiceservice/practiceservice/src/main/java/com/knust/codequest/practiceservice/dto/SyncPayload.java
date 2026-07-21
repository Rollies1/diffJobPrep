package com.knust.codequest.practiceservice.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Offline sync payload — a completed practice session recorded on-device
 * while disconnected, now being batch-uploaded. Mirrors the frontend
 * {@code SyncPayload} type 1:1.
 */
public class SyncPayload {

    private UUID sessionId;
    private String deckId;
    private List<AnswerEntry> answers;
    private Instant startedAt;
    private Instant completedAt;

    public static class AnswerEntry {
        private String questionId;
        private String answerText;
        private long durationMs;

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public String getAnswerText() { return answerText; }
        public void setAnswerText(String answerText) { this.answerText = answerText; }
        public long getDurationMs() { return durationMs; }
        public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public String getDeckId() { return deckId; }
    public void setDeckId(String deckId) { this.deckId = deckId; }
    public List<AnswerEntry> getAnswers() { return answers; }
    public void setAnswers(List<AnswerEntry> answers) { this.answers = answers; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
