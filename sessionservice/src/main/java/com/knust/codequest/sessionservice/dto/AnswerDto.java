package com.knust.codequest.sessionservice.dto;

import java.util.UUID;

public class AnswerDto {
    private UUID id;
    private UUID questionId;
    private String userAnswer;
    private Boolean isCorrect;

    public AnswerDto() {}

    public AnswerDto(UUID id, UUID questionId, String userAnswer, Boolean isCorrect) {
        this.id = id;
        this.questionId = questionId;
        this.userAnswer = userAnswer;
        this.isCorrect = isCorrect;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
}
