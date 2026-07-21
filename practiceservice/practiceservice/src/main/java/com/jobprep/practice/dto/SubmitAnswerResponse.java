package com.jobprep.practice.dto;

import java.time.Instant;

public record SubmitAnswerResponse(
    String answerId,
    String sessionId,
    String questionId,
    String selectedOption,
    String correctOption,
    boolean isCorrect,
    int streak,
    Instant answeredAt
) {}
