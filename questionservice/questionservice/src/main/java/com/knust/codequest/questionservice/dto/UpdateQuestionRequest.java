package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateQuestionRequest(
    @NotBlank String title,
    @NotBlank @Size(max = 10000) String content,
    @NotNull @Pattern(regexp = "easy|medium|hard") String difficulty,
    String hint,
    @NotBlank String category,
    List<@NotBlank String> options,      // For multiple choice
    @NotBlank String correctAnswer,        // Stored separately
    String explanation
) {}
