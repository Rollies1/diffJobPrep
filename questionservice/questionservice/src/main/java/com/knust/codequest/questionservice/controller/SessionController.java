package com.knust.codequest.questionservice.controller;

import com.knust.codequest.questionservice.dto.PracticeSessionDTO;
import com.knust.codequest.questionservice.dto.StartSessionRequest;
import com.knust.codequest.questionservice.dto.CompleteSessionRequest;
import com.knust.codequest.questionservice.dto.UserProgressDTO;
import com.knust.codequest.questionservice.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sessions")
@Tag(name = "Sessions", description = "Practice session tracking")
@Validated
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/progress")
    @Operation(summary = "Get user progress", description = "Aggregated progress by topic")
    public ResponseEntity<List<UserProgressDTO>> getProgress(
            @Parameter(description = "User UUID") @RequestParam UUID userId) {
        return ResponseEntity.ok(sessionService.getUserProgress(userId));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent sessions", description = "Recently completed practice sessions")
    public ResponseEntity<List<PracticeSessionDTO>> getRecent(
            @Parameter(description = "User UUID") @RequestParam UUID userId) {
        return ResponseEntity.ok(sessionService.getRecentSessions(userId));
    }

    @PostMapping
    @Operation(summary = "Start a session", description = "Begin a new practice session")
    @ApiResponse(responseCode = "200", description = "Session started")
    public ResponseEntity<PracticeSessionDTO> startSession(
            @Valid @RequestBody StartSessionRequest request) {
        return ResponseEntity.ok(sessionService.startSession(request.getUserId(), request.getQuestionId()));
    }

    @PatchMapping("/{sessionId}/complete")
    @Operation(summary = "Complete a session", description = "Submit answer and score")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session completed"),
            @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<PracticeSessionDTO> completeSession(
            @Parameter(description = "Session UUID") @PathVariable UUID sessionId,
            @Valid @RequestBody CompleteSessionRequest request) {
        return ResponseEntity.ok(sessionService.completeSession(sessionId, request.getAnswer(), request.getScore(), request.getFeedback(), request.getTimeSpent()));
    }
}
