package com.knust.codequest.questionservice.dto;

public record ReadinessDTO(
    String topicName,
    String status,
    Integer calculatedProgress,
    Integer readinessThreshold,
    Long attempted,
    Long totalQuestions
) {}
