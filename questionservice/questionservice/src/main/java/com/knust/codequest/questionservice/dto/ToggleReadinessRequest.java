package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ToggleReadinessRequest(
    @NotNull(message = "User ID is required")
    UUID userId,
    
    @NotNull(message = "Topic ID is required")
    Integer topicId,
    
    @NotNull(message = "isReady status is required")
    Boolean isReady
) {}
