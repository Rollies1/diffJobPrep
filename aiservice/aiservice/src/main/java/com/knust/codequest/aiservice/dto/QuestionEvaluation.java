package com.knust.codequest.aiservice.dto;

import java.io.Serializable;
import java.util.List;

public record QuestionEvaluation(
    Long questionId,
    Double score,
    String feedback,
    List<String> missingPoints,
    List<String> strengths
) implements Serializable {}
