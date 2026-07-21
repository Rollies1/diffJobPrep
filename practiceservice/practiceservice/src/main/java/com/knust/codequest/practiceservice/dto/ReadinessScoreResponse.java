package com.knust.codequest.practiceservice.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReadinessScoreResponse {
    private int totalSessions;
    private double averageScore;
    private double readinessPercentage;
}