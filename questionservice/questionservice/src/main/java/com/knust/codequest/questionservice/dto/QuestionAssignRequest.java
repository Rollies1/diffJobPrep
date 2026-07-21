package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.NotBlank;

public class QuestionAssignRequest {
    @NotBlank
    private String questionId;

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }
}
