package com.knust.codequest.sessionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserStatsDto {
    private String userId;
    private long totalSessionsCompleted;
    private double averageScore;
}
