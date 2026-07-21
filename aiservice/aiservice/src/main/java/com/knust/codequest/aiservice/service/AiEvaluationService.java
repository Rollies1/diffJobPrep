package com.knust.codequest.aiservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.aiservice.dto.*;
import com.knust.codequest.aiservice.enums.EvaluationStatus;
import com.knust.codequest.aiservice.model.AiEvaluationEntity;
import com.knust.codequest.aiservice.repository.AiEvaluationRepository;
import com.knust.codequest.aiservice.util.CostCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Core orchestrator for AI evaluations.
 * <p>
 * Phase 2 additions:
 * <ul>
 *   <li>Token usage and cost tracking from real LLM calls</li>
 *   <li>Raw LLM response persistence for prompt debugging</li>
 *   <li>Structured result parsing via prompt builder</li>
 * </ul>
 */
import com.knust.codequest.aiservice.metrics.AiEvaluationMetrics;
import com.knust.codequest.aiservice.service.RateLimitService;

@Service
public class AiEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(AiEvaluationService.class);

    private final AiEvaluationRepository repository;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper;
    private final PdfReportService pdfReportService;
    private final CostCalculator costCalculator;
    private final RateLimitService rateLimitService;
    private final AiEvaluationMetrics metrics;
    
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private AiEvaluationService self;

    public AiEvaluationService(AiEvaluationRepository repository,
                               AiProvider aiProvider,
                               ObjectMapper objectMapper,
                               PdfReportService pdfReportService,
                               CostCalculator costCalculator,
                               RateLimitService rateLimitService,
                               AiEvaluationMetrics metrics) {
        this.repository = repository;
        this.aiProvider = aiProvider;
        this.objectMapper = objectMapper;
        this.pdfReportService = pdfReportService;
        this.costCalculator = costCalculator;
        this.rateLimitService = rateLimitService;
        this.metrics = metrics;
    }

    @Transactional
    public EvaluationResponseDTO initiateEvaluation(EvaluationRequestDTO request, String userId) {
        // Rate limit check
        if (!rateLimitService.isAllowed(userId)) {
            metrics.recordRateLimited();
            throw new RateLimitExceededException("Rate limit exceeded. Max 5 evaluations per hour.");
        }

        metrics.recordEvaluationStarted();
        var timer = metrics.startTimer();

        Optional<AiEvaluationEntity> existing = repository
            .findBySessionIdAndPromptVersionAndStatus(
                request.sessionId(), aiProvider.getPromptVersion(), EvaluationStatus.COMPLETED);

        if (existing.isPresent()) {
            log.info("Returning cached evaluation for session={}", request.sessionId());
            metrics.recordDuration(timer);
            return mapToResponse(existing.get());
        }

        AiEvaluationEntity entity = new AiEvaluationEntity();
        entity.setSessionId(request.sessionId());
        entity.setStatus(EvaluationStatus.PROCESSING);
        entity.setPromptVersion(aiProvider.getPromptVersion());
        try {
            entity.setRequestPayload(objectMapper.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            entity.setRequestPayload("serialization_failed");
        }
        entity = repository.save(entity);

        metrics.recordDuration(timer);

        return new EvaluationResponseDTO(
            entity.getId(),
            request.sessionId(),
            entity.getStatus(),
            null, null, null, null,
            "/api/ai/evaluations/" + entity.getId(),
            null
        );
    }

    @Async("taskExecutor")
    @Transactional
    public void processEvaluationAsync(UUID evaluationId, EvaluationRequestDTO request) {
        AiEvaluationEntity entity = repository.findById(evaluationId).orElseThrow();
        if (entity.getStatus() == EvaluationStatus.COMPLETED) {
            return;
        }
        
        try {
            log.info("Processing evaluation id={} session={}", entity.getId(), request.sessionId());

            AiProvider.EvaluationOutput output = aiProvider.evaluateAnswers(request.answers());
            AiEvaluationResult result = output.result();

            entity.setStatus(EvaluationStatus.COMPLETED);
            entity.setOverallScore(BigDecimal.valueOf(result.overallScore()));
            entity.setRawLlmResponse(output.rawResponse());

            entity.setStructuredResult(result);

            // Phase 2: token and cost tracking
            entity.setTokensInput(output.tokensInput());
            entity.setTokensOutput(output.tokensOutput());
            if (output.tokensInput() != null && output.tokensOutput() != null) {
                BigDecimal cost = costCalculator.calculate(output.tokensInput(), output.tokensOutput());
                entity.setEstimatedCostUsd(cost);
                metrics.recordCost(cost);
                metrics.recordTokenUsage(output.tokensInput(), output.tokensOutput());
            }

            entity.setCompletedAt(Instant.now());
            repository.save(entity);

            // Phase 3: trigger async PDF generation
            pdfReportService.generateReport(entity.getId(), result);

            log.info("Evaluation completed id={} score={} tokens={}/{} cost=${}",
                entity.getId(), result.overallScore(),
                output.tokensInput(), output.tokensOutput(),
                entity.getEstimatedCostUsd());

        } catch (Exception e) {
            log.error("Evaluation failed id={}", entity.getId(), e);
            metrics.recordEvaluationFailed();
            entity.setStatus(EvaluationStatus.FAILED);
            entity.setErrorMessage(e.getMessage());
            repository.save(entity);
        }
    }

    /**
     * Admin/Retry endpoint: reprocess a FAILED evaluation.
     * <p>
     * Dead-letter recovery: reads the original request payload from DB
     * and re-executes the AI evaluation with the current prompt version.
     */
    @Transactional
    public EvaluationResponseDTO retryEvaluation(UUID evaluationId) {
        metrics.recordRetry();

        AiEvaluationEntity entity = repository.findById(evaluationId)
            .orElseThrow(() -> new EvaluationNotFoundException("Evaluation not found: " + evaluationId));

        if (entity.getStatus() != EvaluationStatus.FAILED) {
            throw new IllegalStateException("Only FAILED evaluations can be retried. Current status: " + entity.getStatus());
        }

        log.info("Retrying evaluation id={}", evaluationId);
        entity.setStatus(EvaluationStatus.PROCESSING);
        entity.setErrorMessage(null);
        entity = repository.save(entity);

        try {
            EvaluationRequestDTO request = objectMapper.readValue(
                entity.getRequestPayload(), EvaluationRequestDTO.class);
            // Re-trigger async processing via the proxy to respect @Async
            self.processEvaluationAsync(evaluationId, request);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize request payload for retry id={}", evaluationId, e);
            entity.setStatus(EvaluationStatus.FAILED);
            entity.setErrorMessage("Retry failed: could not parse original request");
            repository.save(entity);
        }

        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    public EvaluationResponseDTO getEvaluation(UUID evaluationId) {
        AiEvaluationEntity entity = repository.findById(evaluationId)
            .orElseThrow(() -> new EvaluationNotFoundException("Evaluation not found: " + evaluationId));
        return mapToResponse(entity);
    }

    private EvaluationResponseDTO mapToResponse(AiEvaluationEntity entity) {
        List<QuestionEvaluation> feedback = null;
        String summary = null;
        if (entity.getStructuredResult() != null) {
            AiEvaluationResult result = entity.getStructuredResult();
            feedback = result.questionEvaluations();
            summary = result.overallFeedback();
        }

        return new EvaluationResponseDTO(
            entity.getId(),
            entity.getSessionId(),
            entity.getStatus(),
            entity.getOverallScore() != null ? entity.getOverallScore().doubleValue() : null,
            feedback,
            summary,
            entity.getGeneratedPdfUrl(),
            entity.getStatus() == EvaluationStatus.PROCESSING ? "/api/ai/evaluations/" + entity.getId() : null,
            entity.getCompletedAt()
        );
    }

    public static class EvaluationNotFoundException extends RuntimeException {
        public EvaluationNotFoundException(String message) { super(message); }
    }

    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) { super(message); }
    }
}
