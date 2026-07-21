package com.knust.codequest.sessionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Aggregate user stats for the dashboard. Mirrors the frontend
 * {@code UserStats} type 1:1 (13 fields).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDto {

    private String userId;

    // Session-derived
    private int weeklyGoal;
    private double completionRate;     // 0-100
    private int streakDays;
    private long totalAnswered;
    private int weeklySessions;
    private int weeklyQuestions;
    private Map<String, Integer> skillBreakdown;

    // XP / level
    private long totalXp;
    private int currentLevel;
    private long xpInCurrentLevel;
    private long xpToNextLevel;
    private String rankName;

    /** Convenience factory defaulting the aspirational fields. */
    public static UserStatsDto derived(String userId, long totalAnswered, int weeklySessions,
                                       int streakDays, double completionRate) {
        long totalXp = totalAnswered * 10L;
        int level = (int) (totalXp / 500) + 1;
        long xpInLevel = totalXp % 500;
        return new UserStatsDto(
                userId,
                50,                 // weeklyGoal
                Math.round(completionRate * 100) / 100.0,
                streakDays,
                totalAnswered,
                weeklySessions,
                (int) totalAnswered,
                java.util.Map.of(),
                totalXp,
                level,
                xpInLevel,
                500 - xpInLevel,
                rankFor(level)
        );
    }

    private static String rankFor(int level) {
        if (level >= 20) return "Master";
        if (level >= 10) return "Expert";
        if (level >= 5) return "Practitioner";
        return "Apprentice";
    }
}
