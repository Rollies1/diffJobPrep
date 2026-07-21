package com.knust.codequest.practiceservice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class PracticeSessionDto {

    private UUID sessionId;
    private String status;
    private String categoryName;
    private String difficulty;
    private int totalQuestions;
    private int questionsAnswered;
    private UUID evaluationId;
    private String evaluationStatus;
    private String pollUrl;
    private BigDecimal overallScore;
    private Instant startedAt;
    private Instant completedAt;
    private List<QuestionSlotDto> questions;

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getQuestionsAnswered() { return questionsAnswered; }
    public void setQuestionsAnswered(int questionsAnswered) { this.questionsAnswered = questionsAnswered; }

    public UUID getEvaluationId() { return evaluationId; }
    public void setEvaluationId(UUID evaluationId) { this.evaluationId = evaluationId; }

    public String getEvaluationStatus() { return evaluationStatus; }
    public void setEvaluationStatus(String evaluationStatus) { this.evaluationStatus = evaluationStatus; }

    public String getPollUrl() { return pollUrl; }
    public void setPollUrl(String pollUrl) { this.pollUrl = pollUrl; }

    public BigDecimal getOverallScore() { return overallScore; }
    public void setOverallScore(BigDecimal overallScore) { this.overallScore = overallScore; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public List<QuestionSlotDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionSlotDto> questions) { this.questions = questions; }
}
