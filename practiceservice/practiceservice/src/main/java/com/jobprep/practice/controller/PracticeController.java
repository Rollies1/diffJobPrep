package com.jobprep.practice.controller;

import com.jobprep.practice.dto.SubmitAnswerRequest;
import com.jobprep.practice.dto.SubmitAnswerResponse;
import com.jobprep.practice.service.IdempotencyService;
import com.jobprep.practice.service.IdempotencyService.IdempotentResult;
import com.jobprep.practice.service.PracticeSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Practice answer submission — idempotent.
 *
 * POST /api/practice/submit
 * Headers:
 *   Idempotency-Key: <client-generated UUID>
 *   X-User-Id: <set by gateway>
 *
 * Behaviour:
 *   - Same (userId, key) + same body  → 200 + Idempotent-Replay: true header
 *   - Same (userId, key) + diff body  → 409 Conflict
 *   - New key                         → 201 Created + new answer row
 *
 * Race safety:
 *   PostgreSQL's ON CONFLICT DO NOTHING guarantees exactly one INSERT
 *   wins under concurrent submission. The loser falls through to the
 *   replay branch and returns the winner's response.
 */
@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final IdempotencyService idempotencyService;
    private final PracticeSessionService practiceService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswer(
        @RequestHeader("X-User-Id") String userId,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody SubmitAnswerRequest body
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "idempotency_key_required"));
        }

        IdempotentResult<SubmitAnswerResponse> result = idempotencyService.execute(
            userId,
            idempotencyKey,
            body,
            () -> {
                SubmitAnswerResponse response = practiceService.submitAnswer(userId, body);
                if (response == null) {
                    return IdempotentResult.error(403, "session_not_owned");
                }
                return IdempotentResult.success(201, response);
            }
        );

        // Build response with appropriate headers.
        HttpStatus status = HttpStatus.valueOf(result.status());
        var headers = new org.springframework.http.HttpHeaders();
        if (result.replayed()) {
            headers.add("Idempotent-Replay", "true");
        }
        if (result.conflict()) {
            headers.add("Idempotent-Conflict", "true");
        }

        return new ResponseEntity<>(result.body(), headers, status);
    }
}
