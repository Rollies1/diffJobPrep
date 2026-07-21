package com.knust.codequest.practiceservice.dto;

public class UserStatsDto {
    private String userId;
    private long totalSessionsCompleted;
    private double averageScore;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public long getTotalSessionsCompleted() { return totalSessionsCompleted; }
    public void setTotalSessionsCompleted(long totalSessionsCompleted) { this.totalSessionsCompleted = totalSessionsCompleted; }

    public double getAverageScore() { return averageScore; }
    public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
}
