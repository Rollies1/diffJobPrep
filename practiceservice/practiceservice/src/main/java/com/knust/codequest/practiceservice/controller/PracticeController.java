package com.knust.codequest.practiceservice.controller;

import com.knust.codequest.practiceservice.dto.StartSessionRequest;
import com.knust.codequest.practiceservice.dto.SubmitAnswerRequest;
import com.knust.codequest.practiceservice.entity.PracticeSession;
import com.knust.codequest.practiceservice.entity.UserAnswer;
import com.knust.codequest.practiceservice.service.PracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.knust.codequest.practiceservice.dto.ReadinessScoreResponse;
import com.knust.codequest.practiceservice.dto.ReadinessScoreResponse;
import java.util.stream.Collectors;
import java.util.List;
import com.knust.codequest.practiceservice.dto.SubmitAnswerResponse;



@RestController
@RequestMapping("/api/practice")@RequiredArgsConstructor
@CrossOrigin(origins = "*")

public class PracticeController {

    private final PracticeService practiceService;

    @PostMapping("/start")
    public ResponseEntity<PracticeSession> startSession(@RequestBody StartSessionRequest request) {
        return ResponseEntity.ok(practiceService.startSession(request));
    }

    @PostMapping("/submit")
    public ResponseEntity<SubmitAnswerResponse> submitAnswer(@RequestBody SubmitAnswerRequest request) {
        return ResponseEntity.ok(practiceService.submitAnswer(request));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<PracticeSession>> getHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(practiceService.getHistory(userId));
    }

    @GetMapping("/session/{sessionId}/answers")
    public ResponseEntity<List<UserAnswer>> getAnswersBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(practiceService.getAnswersBySession(sessionId));
    }
    @GetMapping("/readiness/{userId}")
    public ResponseEntity<ReadinessScoreResponse> getReadinessScore(@PathVariable Long userId) {
        return ResponseEntity.ok(practiceService.getReadinessScore(userId));
    }
}