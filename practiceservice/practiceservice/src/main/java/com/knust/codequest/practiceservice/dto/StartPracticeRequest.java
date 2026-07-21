package com.knust.codequest.practiceservice.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public class StartPracticeRequest {

    @NotNull(message = "categoryId is required")
    private UUID categoryId;

    @NotNull(message = "difficulty is required")
    private Difficulty difficulty;

    @Min(value = 1, message = "at least 1 question")
    @Max(value = 50, message = "max 50 questions")
    private int questionCount = 5;

    public enum Difficulty { EASY, MEDIUM, HARD }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
}
