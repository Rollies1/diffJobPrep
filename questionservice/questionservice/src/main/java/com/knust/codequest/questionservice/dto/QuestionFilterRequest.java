package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuestionFilterRequest {

    @NotBlank(message = "Role is required")
    @Size(max = 50, message = "Role must be at most 50 characters")
    private String role;

    @Size(max = 20, message = "Level must be at most 20 characters")
    private String level;

    @Size(max = 50, message = "Topic must be at most 50 characters")
    private String topic;

    @Min(value = 1, message = "Difficulty must be at least 1")
    @Max(value = 5, message = "Difficulty must be at most 5")
    private Integer difficulty;
}
