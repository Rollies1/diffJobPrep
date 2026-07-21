package com.knust.codequest.aiservice.dto;

import java.io.Serializable;
import java.util.List;

public record AiEvaluationResult(
    List<QuestionEvaluation> questionEvaluations,
    Double overallScore,
    String overallFeedback
) implements Serializable {}
