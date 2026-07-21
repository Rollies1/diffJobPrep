package com.knust.codequest.aiservice.model;

import com.knust.codequest.aiservice.dto.AiEvaluationResult;
import com.knust.codequest.aiservice.enums.EvaluationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_evaluations")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class AiEvaluationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvaluationStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String requestPayload; // Stored as String for raw JSON

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String rawLlmResponse;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private AiEvaluationResult structuredResult;

    private Integer tokensInput;
    private Integer tokensOutput;
    
    @Column(precision = 10, scale = 4)
    private java.math.BigDecimal estimatedCostUsd;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal overallScore;

    @Column(length = 2000)
    private String errorMessage;

    private String generatedPdfUrl;

    private java.time.Instant completedAt;

    @Column(nullable = false)
    private String promptVersion;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
