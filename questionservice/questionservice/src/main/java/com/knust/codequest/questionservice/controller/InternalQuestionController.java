package com.knust.codequest.questionservice.controller;

import com.knust.codequest.questionservice.dto.GradeRequest;
import com.knust.codequest.questionservice.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/questions")
@RequiredArgsConstructor
public class InternalQuestionController {

    private final QuestionService questionService;

    @PostMapping("/{id}/grade")
    public ResponseEntity<Boolean> gradeQuestion(@PathVariable String id, @RequestBody GradeRequest request) {
        boolean isCorrect = questionService.gradeQuestion(id, request);
        return ResponseEntity.ok(isCorrect);
    }
}
