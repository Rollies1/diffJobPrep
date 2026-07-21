package com.knust.codequest.practiceservice.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public class SubmitAnswerRequest {

    @NotNull(message = "questionId is required")
    private UUID questionId;

    @NotBlank(message = "answer is required")
    @Size(max = 5000, message = "answer must be under 5000 characters")
    private String answer;

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
}