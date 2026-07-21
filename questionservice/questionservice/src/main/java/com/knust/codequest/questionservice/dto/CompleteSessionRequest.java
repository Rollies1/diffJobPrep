package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CompleteSessionRequest {

    @NotBlank(message = "Answer is required")
    private String answer;

    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be at least 0")
    @Max(value = 100, message = "Score must be at most 100")
    private Integer score;

    @NotBlank(message = "Feedback is required")
    private String feedback;

    @NotNull(message = "Time spent is required")
    @Min(value = 1, message = "Time spent must be at least 1 second")
    private Integer timeSpent;
}
