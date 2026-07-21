package com.knust.codequest.aiservice.dto;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EvaluationRequestDTO(
    String correlationId,
    LocalDateTime requestedAt,
    UUID sessionId,
    UUID userId,
    List<AnswerDTO> answers
) implements Serializable {}
