package com.knust.codequest.questionservice.controller;

import com.knust.codequest.questionservice.dto.*;
import com.knust.codequest.questionservice.entity.Category;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Question-bank endpoints. All mapped under /api/questions so the gateway
 * route /api/questions/** reaches this controller. CORS is handled centrally
 * by the gateway — no per-controller @CrossOrigin.
 *
 * Frontend contract served:
 *   GET  /api/questions/decks                      → DeckDto[]
 *   GET  /api/questions/decks/{deckId}/questions    → PaginatedQuestionsResponse
 *   GET  /api/questions/{questionId}                → QuestionDto
 *   GET  /api/questions/categories                  → string[]   (category names)
 *   GET  /api/questions                            → Question[]  (admin/debug)
 *   POST /api/questions/sync                        → SyncResponse
 *   GET  /api/questions/random                      → QuestionSlotDto[] (for practiceservice)
 *   GET  /api/questions/category/{categoryId}       → Question[]
 *   POST /api/questions                             → Question
 *   POST /api/questions/categories                  → Category
 */
@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    // ── Decks ────────────────────────────────────────────────────

    @GetMapping("/decks")
    public ResponseEntity<List<DeckDto>> getDecks() {
        return ResponseEntity.ok(questionService.getDecks());
    }

    @GetMapping("/decks/{deckId}/questions")
    public ResponseEntity<PaginatedQuestionsResponse> getDeckQuestions(
            @PathVariable String deckId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(questionService.getQuestionsByDeck(deckId, cursor, limit));
    }

    // ── Single question ──────────────────────────────────────────

    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionDto> getQuestion(@PathVariable String questionId) {
        return ResponseEntity.ok(questionService.getQuestion(questionId));
    }

    // ── Categories ───────────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(questionService.getCategoryNames());
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable UUID id) {
        return ResponseEntity.ok(questionService.getCategoryById(id));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Question>> getQuestionsByCategory(@PathVariable UUID categoryId) {
        return ResponseEntity.ok(questionService.getQuestionsByCategory(categoryId));
    }

    /**
     * GET /api/questions/random?categoryId=&difficulty=&count=
     * Returns QuestionSlotDto[] (questionId/questionText/expectedKeywords) —
     * the exact shape practiceservice's QuestionServiceClient deserializes.
     */
    @GetMapping("/random")
    public ResponseEntity<List<QuestionSlotDto>> getRandomQuestions(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "5") int count) {
        return ResponseEntity.ok(questionService.getRandomQuestionSlots(categoryId, difficulty, count));
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> addCategory(@RequestBody Category category) {
        return ResponseEntity.ok(questionService.addCategory(category));
    }

    // ── All questions (admin) ────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @PostMapping
    public ResponseEntity<Question> addQuestion(@RequestBody Question question) {
        return ResponseEntity.ok(questionService.addQuestion(question));
    }

    // ── Sync ─────────────────────────────────────────────────────

    @PostMapping("/sync")
    public ResponseEntity<SyncResponse> sync(@RequestBody SyncRequest request) {
        return ResponseEntity.ok(questionService.sync(request));
    }
}
