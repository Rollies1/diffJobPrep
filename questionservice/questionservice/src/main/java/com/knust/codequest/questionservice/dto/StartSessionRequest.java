package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class StartSessionRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Question ID is required")
    private UUID questionId;
}
