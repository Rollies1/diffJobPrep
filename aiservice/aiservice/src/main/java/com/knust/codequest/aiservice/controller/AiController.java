package com.knust.codequest.aiservice.controller;

import com.knust.codequest.aiservice.dto.CvRequest;
import com.knust.codequest.aiservice.dto.EvaluationRequest;
import com.knust.codequest.aiservice.dto.EvaluationResponse;
import com.knust.codequest.aiservice.service.AiService;
import com.knust.codequest.aiservice.service.CvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AI endpoints. All mapped under /api/ai so the gateway route /api/ai/**
 * reaches this controller.
 *
 * Frontend contract served:
 *   POST /api/ai/evaluate    → EvaluationResponse (strengths/weaknesses/suggestions/score)
 *   POST /api/ai/chat        → { reply }  (non-streaming fallback for the tutor)
 *   POST /api/ai/cv/generate → PDF bytes
 *
 * Bonus hint/explain/feedback shortcuts delegate to the same evaluate()
 * pipeline with a system-flavoured prompt prefix.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final CvService cvService;
    private final AiService aiService;

    /** POST /ai/evaluate — evaluate an open-ended answer. */
    @PostMapping("/evaluate")
    public ResponseEntity<EvaluationResponse> evaluate(@RequestBody EvaluationRequest request) {
        return ResponseEntity.ok(aiService.evaluate(request));
    }

    /**
     * POST /ai/chat — conversational tutor. The frontend reads the response
     * body as a stream; we return the full reply as plain text so the reader
     * receives it in one chunk. Falls back to a canned reply if no provider
     * key is configured.
     */
    @PostMapping(value = "/chat", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> chat(@RequestBody Map<String, Object> body) {
        String message = body.getOrDefault("message", "").toString();
        String reply = aiService.chat(message);
        return ResponseEntity.ok(reply);
    }

    /** POST /ai/hint — get a hint for a question. */
    @PostMapping("/hint")
    public ResponseEntity<EvaluationResponse> hint(@RequestBody EvaluationRequest request) {
        EvaluationResponse resp = aiService.evaluate(request);
        // Keep only suggestions for a hint.
        return ResponseEntity.ok(new EvaluationResponse(
                List.of(), List.of(), resp.getSuggestions(), resp.getScore(), resp.getSource()));
    }

    /** POST /ai/explain — get an explanation for a question. */
    @PostMapping("/explain")
    public ResponseEntity<EvaluationResponse> explain(@RequestBody EvaluationRequest request) {
        return ResponseEntity.ok(aiService.evaluate(request));
    }

    /** POST /ai/feedback — get focused feedback on an answer. */
    @PostMapping("/feedback")
    public ResponseEntity<EvaluationResponse> feedback(@RequestBody EvaluationRequest request) {
        return ResponseEntity.ok(aiService.evaluate(request));
    }

    @PostMapping("/cv/generate")
    public ResponseEntity<byte[]> generateCv(@RequestBody CvRequest request) {
        try {
            byte[] pdf = cvService.generateCv(request);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + request.getName().replace(" ", "_") + "_CV.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
