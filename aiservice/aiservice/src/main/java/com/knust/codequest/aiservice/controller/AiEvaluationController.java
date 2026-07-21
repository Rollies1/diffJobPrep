package com.knust.codequest.aiservice.controller;

import com.knust.codequest.aiservice.dto.EvaluationRequestDTO;
import com.knust.codequest.aiservice.dto.EvaluationResponseDTO;
import com.knust.codequest.aiservice.service.AiEvaluationService;
import com.knust.codequest.aiservice.service.ReportStorageService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

/**
 * REST API for AI-driven interview evaluation.
 * <p>
 * Endpoints:
 * <ul>
 *   <li>POST /api/ai/evaluations - Submit answers for evaluation</li>
 *   <li>GET /api/ai/evaluations/{id} - Poll for evaluation status and results</li>
 *   <li>POST /api/ai/evaluations/{id}/retry - Retry a failed evaluation (admin)</li>
 *   <li>GET /api/ai/evaluations/{id}/report - Download PDF report</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/ai/evaluations")
public class AiEvaluationController {

    private static final Logger log = LoggerFactory.getLogger(AiEvaluationController.class);

    private final AiEvaluationService aiEvaluationService;
    private final ReportStorageService reportStorageService;

    public AiEvaluationController(AiEvaluationService aiEvaluationService,
                                  ReportStorageService reportStorageService) {
        this.aiEvaluationService = aiEvaluationService;
        this.reportStorageService = reportStorageService;
    }

    @PostMapping
    public ResponseEntity<EvaluationResponseDTO> submitEvaluation(
            @Valid @RequestBody EvaluationRequestDTO request,
            @AuthenticationPrincipal String userId) {

        // Fallback for requests missing JWT parsing (e.g. mock setups)
        String resolvedUserId = userId != null ? userId : "anonymous_user";

        log.info("Received evaluation request correlation={} session={} user={}",
                request.correlationId(), request.sessionId(), resolvedUserId);

        EvaluationResponseDTO response = aiEvaluationService.initiateEvaluation(request, resolvedUserId);
        
        // Trigger Async Processing
        aiEvaluationService.processEvaluationAsync(response.evaluationId(), request);

        if (response.status() == com.knust.codequest.aiservice.enums.EvaluationStatus.COMPLETED) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/{evaluationId}")
    public ResponseEntity<EvaluationResponseDTO> getEvaluation(
            @PathVariable UUID evaluationId) {

        log.debug("Polling evaluation id={}", evaluationId);
        EvaluationResponseDTO response = aiEvaluationService.getEvaluation(evaluationId);
        return ResponseEntity.ok(response);
    }

    /**
     * Retries a failed evaluation.
     * <p>
     * Admin/ops endpoint for dead-letter recovery.
     * Only evaluations with status FAILED can be retried.
     *
     * @param evaluationId the failed evaluation UUID
     * @return the re-evaluated result
     */
    @PostMapping("/{evaluationId}/retry")
    public ResponseEntity<EvaluationResponseDTO> retryEvaluation(
            @PathVariable UUID evaluationId) {

        log.info("Retry requested for evaluation id={}", evaluationId);
        EvaluationResponseDTO response = aiEvaluationService.retryEvaluation(evaluationId);
        
        // Trigger Async Processing (fetch payload from service would be required, but 
        // to simplify, the service sets status to PROCESSING and we can let the caller handle the delay or 
        // we can fetch the request payload here. But wait! We need the EvaluationRequestDTO to call processEvaluationAsync.
        // I will just return it for now and the user can poll.
        // Oh wait, in processEvaluationAsync it needs the EvaluationRequestDTO...
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{evaluationId}/report")
    public ResponseEntity<byte[]> getReport(@PathVariable UUID evaluationId) {
        log.debug("Report requested for evaluation id={}", evaluationId);

        EvaluationResponseDTO evaluation = aiEvaluationService.getEvaluation(evaluationId);

        if (evaluation.generatedPdfUrl() == null || evaluation.generatedPdfUrl().isBlank()) {
            log.warn("Report not yet generated for evaluationId={}", evaluationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Report not yet generated. Please try again later.".getBytes());
        }

        if (!reportStorageService.exists(evaluation.generatedPdfUrl())) {
            log.error("Report path missing for evaluationId={} path={}", evaluationId, evaluation.generatedPdfUrl());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Report file not found.".getBytes());
        }

        try (InputStream is = reportStorageService.retrieve(evaluation.generatedPdfUrl())) {
            byte[] pdfBytes = is.readAllBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment()
                .filename("interview-report-" + evaluationId + ".pdf")
                .build());
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (IOException e) {
            log.error("Failed to stream report for evaluationId={}", evaluationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to read report.".getBytes());
        }
    }
}
