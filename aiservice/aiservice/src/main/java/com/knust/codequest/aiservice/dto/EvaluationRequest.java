package com.knust.codequest.aiservice.dto;

import lombok.Data;

@Data
public class EvaluationRequest {
    private String question;
    private String answer;
    private String category;
}