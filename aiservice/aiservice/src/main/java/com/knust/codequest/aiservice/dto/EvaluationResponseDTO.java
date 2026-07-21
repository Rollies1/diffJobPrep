package com.knust.codequest.aiservice.dto;

import com.knust.codequest.aiservice.enums.EvaluationStatus;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EvaluationResponseDTO(
    UUID evaluationId,
    UUID sessionId,
    EvaluationStatus status,
    Double overallScore,
    List<QuestionEvaluation> feedback,
    String summary,
    String generatedPdfUrl,
    String pollUrl,
    Instant completedAt
) implements Serializable {}
