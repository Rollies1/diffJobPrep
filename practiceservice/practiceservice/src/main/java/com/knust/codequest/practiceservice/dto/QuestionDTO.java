package com.knust.codequest.practiceservice.dto;

import lombok.Data;

@Data
public class QuestionDTO {
    private Long id;
    private String question;
    private String sampleAnswer;
    private String difficulty;
}
