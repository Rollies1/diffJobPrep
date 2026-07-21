package com.knust.codequest.questionservice.controller;

import com.knust.codequest.questionservice.entity.Category;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(questionService.getAllCategories());
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getCategoryById(id));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Question>> getQuestionsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(questionService.getQuestionsByCategory(categoryId));
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> addCategory(@RequestBody Category category) {
        return ResponseEntity.ok(questionService.addCategory(category));
    }

    @PostMapping
    public ResponseEntity<Question> addQuestion(@RequestBody Question question) {
        return ResponseEntity.ok(questionService.addQuestion(question));
    }
}