package com.jobprep.practice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitAnswerRequest(
    @NotBlank @Size(max = 36) String sessionId,
    @NotBlank @Size(max = 128) String questionId,
    @NotBlank @Size(max = 1024) String questionText,
    @NotBlank @Size(max = 256) String selectedOption,
    @Size(max = 256) String correctOption  // server would normally look this up
) {}
