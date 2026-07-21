package com.knust.codequest.sessionservice.controller;

import com.knust.codequest.sessionservice.dto.*;
import com.knust.codequest.sessionservice.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<SessionDto> createSession(@Valid @RequestBody CreateSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(request));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionDto> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.getSession(sessionId));
    }

    @PostMapping("/{sessionId}/answers")
    public ResponseEntity<SessionDto> submitAnswer(
            @PathVariable UUID sessionId,
            @Valid @RequestBody SubmitAnswerRequest request) {
        return ResponseEntity.ok(sessionService.submitAnswer(sessionId, request));
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<SessionDto> completeSession(
            @PathVariable UUID sessionId,
            @Valid @RequestBody CompleteSessionRequest request) {
        return ResponseEntity.ok(sessionService.completeSession(sessionId, request));
    }

    @PostMapping("/{sessionId}/abandon")
    public ResponseEntity<Void> abandonSession(@PathVariable UUID sessionId) {
        sessionService.abandonSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID sessionId) {
        sessionService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<SessionDto>> getSessions(
            @RequestParam String userId,
            Pageable pageable) {
        return ResponseEntity.ok(sessionService.getUserSessions(userId, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDto> getStats(@RequestParam String userId) {
        return ResponseEntity.ok(sessionService.getUserStats(userId));
    }
}
