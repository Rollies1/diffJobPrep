package com.knust.codequest.practiceservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartSessionRequest {
    @NotNull(message = "Topic ID is required")
    private Integer topicId;
}