package com.knust.codequest.practiceservice.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmitAnswerResponse {
    private Long id;
    private Long questionId;
    private String answer;
    private String aiFeedback;
    private Double aiScore;
    private String sampleAnswer;
}