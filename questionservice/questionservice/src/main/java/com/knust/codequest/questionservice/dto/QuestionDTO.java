package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record QuestionDTO(
    UUID questionId,
    
    @NotBlank(message = "Question content cannot be blank")
    @Size(min = 10, message = "Question content must be at least 10 characters")
    String content,
    
    String modelAnswer,
    
    @NotNull(message = "Difficulty level is required")
    @Min(value = 1, message = "Difficulty must be at least 1")
    @Max(value = 10, message = "Difficulty must not exceed 10")
    Integer difficulty,
    
    @Min(value = 0, message = "Time must be positive")
    Integer timeSeconds,
    
    String source,
    String companyTag,
    
    @Size(max = 5, message = "Language code must be at most 5 characters")
    String language,
    
    List<String> topics,
    List<String> roles
) {}
