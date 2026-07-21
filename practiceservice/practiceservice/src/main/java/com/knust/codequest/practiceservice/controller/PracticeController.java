package com.knust.codequest.practiceservice.controller;

import com.knust.codequest.practiceservice.dto.*;
import com.knust.codequest.practiceservice.service.PracticeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @PostMapping("/sessions")
    public ResponseEntity<PracticeSessionDto> startPractice(
            @Valid @RequestBody StartPracticeRequest request,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(practiceService.startPractice(userId, request));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<PracticeSessionDto> getSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(practiceService.getPracticeSession(sessionId));
    }

    @PostMapping("/sessions/{sessionId}/answers")
    public ResponseEntity<PracticeSessionDto> submitAnswer(
            @PathVariable UUID sessionId,
            @Valid @RequestBody SubmitAnswerRequest request,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(practiceService.submitAnswer(sessionId, userId, request));
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<PracticeSessionDto> completePractice(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(practiceService.completePractice(sessionId, userId));
    }

    @PostMapping("/sessions/{sessionId}/abandon")
    public ResponseEntity<Void> abandonPractice(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal String userId) {
        practiceService.abandonPractice(sessionId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sessions")
    public ResponseEntity<Page<PracticeSessionDto>> getMySessions(
            Pageable pageable,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(practiceService.getMySessions(userId, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDto> getMyStats(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(practiceService.getMyStats(userId));
    }
}