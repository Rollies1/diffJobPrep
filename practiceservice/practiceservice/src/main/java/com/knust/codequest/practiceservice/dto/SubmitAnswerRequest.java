package com.knust.codequest.practiceservice.dto;

import lombok.Data;

@Data
public class SubmitAnswerRequest {
    private Long sessionId;
    private Long questionId;
    private String answer;
    private String question;
    private String category;
    private String sampleAnswer;
}