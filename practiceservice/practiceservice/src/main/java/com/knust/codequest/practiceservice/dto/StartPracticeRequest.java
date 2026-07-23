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

    /**
     * Optional session mode. Defaults to {@link Mode#QUICK}.
     * <ul>
     *   <li>{@code QUICK}  — a lightweight practice run (default behaviour).</li>
     *   <li>{@code MOCK}   — a timed mock interview with stricter scoring & a
     *       fixed question budget. The frontend PracticeSetupScreen triggers
     *       this from the "Timed mock" / "Start mock interview" CTAs.</li>
     * </ul>
     * Kept optional + defaulted so existing callers that omit it are unaffected.
     */
    private Mode mode = Mode.QUICK;

    public enum Difficulty { EASY, MEDIUM, HARD }

    public enum Mode { QUICK, MOCK }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }

    public Mode getMode() { return mode; }
    public void setMode(Mode mode) { this.mode = mode == null ? Mode.QUICK : mode; }
}
