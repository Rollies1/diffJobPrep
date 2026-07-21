package com.knust.codequest.questionservice.controller;

import com.knust.codequest.questionservice.dto.ReadinessDTO;
import com.knust.codequest.questionservice.security.SecurityUtils;
import com.knust.codequest.questionservice.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/readiness")
@Tag(name = "Readiness", description = "Interview readiness checklist")
@SecurityRequirement(name = "bearerAuth")
public class ReadinessController {

    private final SessionService sessionService;

    public ReadinessController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    @Operation(summary = "Get readiness checklist", description = "Per-topic readiness with user toggle + calculated progress")
    public ResponseEntity<List<ReadinessDTO>> getReadiness() {
        return ResponseEntity.ok(sessionService.getReadinessChecklist(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/toggle")
    @Operation(summary = "Toggle topic readiness", description = "Mark a topic as ready/not ready")
    public ResponseEntity<Void> toggleReadiness(
            @RequestParam @NotNull Integer topicId) {
        sessionService.toggleTopicReadiness(SecurityUtils.getCurrentUserId(), topicId);
        return ResponseEntity.ok().build();
    }
}
