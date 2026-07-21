package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UserProgressDTO(
    @NotBlank(message = "Topic cannot be blank")
    String topic,
    
    @Min(value = 0, message = "Questions attempted cannot be negative")
    Long questionsAttempted,
    
    @Min(value = 0, message = "Average score cannot be negative")
    Double avgScore,
    
    @Min(value = 0, message = "Average time cannot be negative")
    Double avgTime
) {}
