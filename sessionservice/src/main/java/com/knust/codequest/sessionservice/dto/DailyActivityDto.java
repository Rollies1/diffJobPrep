package com.knust.codequest.sessionservice.dto;

import java.time.LocalDate;

/**
 * One day of activity for the heatmap/chart. Mirrors the frontend
 * {@code DailyActivityDto} type 1:1.
 */
public class DailyActivityDto {

    private LocalDate date;
    private int sessionsCompleted;
    private int questionsAnswered;
    private long timeSpentSeconds;
    private double scoreSum;
    private int xpEarned;

    public DailyActivityDto() {}

    public DailyActivityDto(LocalDate date, int sessionsCompleted, int questionsAnswered,
                            long timeSpentSeconds, double scoreSum, int xpEarned) {
        this.date = date;
        this.sessionsCompleted = sessionsCompleted;
        this.questionsAnswered = questionsAnswered;
        this.timeSpentSeconds = timeSpentSeconds;
        this.scoreSum = scoreSum;
        this.xpEarned = xpEarned;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public int getSessionsCompleted() { return sessionsCompleted; }
    public void setSessionsCompleted(int sessionsCompleted) { this.sessionsCompleted = sessionsCompleted; }
    public int getQuestionsAnswered() { return questionsAnswered; }
    public void setQuestionsAnswered(int questionsAnswered) { this.questionsAnswered = questionsAnswered; }
    public long getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(long timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public double getScoreSum() { return scoreSum; }
    public void setScoreSum(double scoreSum) { this.scoreSum = scoreSum; }
    public int getXpEarned() { return xpEarned; }
    public void setXpEarned(int xpEarned) { this.xpEarned = xpEarned; }
}
