package com.knust.codequest.sessionservice.dto;

import com.knust.codequest.sessionservice.model.Session.Status;
import com.knust.codequest.sessionservice.model.Session.Difficulty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class SessionDTO {
    private UUID id;
    private String userId; // Orchestrator expects String userId
    private UUID categoryId;
    private Difficulty difficulty;
    private Status status;
    private int totalQuestions;
    private int questionsAnswered;
    private UUID evaluationId;
    private BigDecimal overallScore;
    private Instant startedAt;
    private Instant completedAt;
}
