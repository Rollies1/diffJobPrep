package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record PracticeSessionDTO(
    UUID sessionId,
    
    @NotNull(message = "User ID cannot be null")
    UUID userId,
    
    @NotNull(message = "Question ID cannot be null")
    UUID questionId,
    
    String questionContent,
    LocalDateTime startedAt,
    LocalDateTime completedAt,
    
    @Min(value = 0, message = "Score cannot be negative")
    Integer score,
    
    @Min(value = 0, message = "Time spent cannot be negative")
    Integer timeSpentSec,
    
    @Size(max = 20, message = "Status length cannot exceed 20 characters")
    String status
) {}
