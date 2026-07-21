package com.knust.codequest.aiservice.dto;

import java.io.Serializable;
import java.util.List;

public record AnswerDTO(
    Long questionId,
    String questionText,
    List<String> expectedKeywords,
    String userAnswer,
    Integer durationSeconds
) implements Serializable {}
