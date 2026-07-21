package com.knust.codequest.sessionservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CompleteSessionRequest {
    private UUID evaluationId;
    private BigDecimal overallScore;
}
