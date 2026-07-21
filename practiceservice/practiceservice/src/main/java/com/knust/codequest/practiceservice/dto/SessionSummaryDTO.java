package com.knust.codequest.practiceservice.dto;

import com.knust.codequest.practiceservice.entity.SessionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record SessionSummaryDTO(
    UUID sessionId,
    Integer topicId,
    SessionStatus status,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer overallScore,
    Long answersSubmitted
) {}
