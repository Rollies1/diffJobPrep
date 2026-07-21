package com.knust.codequest.questionservice.dto;

public record TopicReadinessDTO(
    Integer topicId,
    String topicName,
    Boolean isReady,
    Long questionsAttempted,
    Double avgScore,
    Double avgTime
) {}
