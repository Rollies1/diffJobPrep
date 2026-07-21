package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.dto.*;
import com.knust.codequest.questionservice.entity.Category;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.repository.CategoryRepository;
import com.knust.codequest.questionservice.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final CategoryRepository categoryRepository;
    private final QuestionRepository questionRepository;

    // ── Categories ───────────────────────────────────────────────

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    /** Category names only — matches the frontend {@code string[]} contract. */
    public List<String> getCategoryNames() {
        return categoryRepository.findAll().stream()
                .map(Category::getName)
                .collect(Collectors.toList());
    }

    public Category getCategoryById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public List<Question> getQuestionsByCategory(UUID categoryId) {
        return questionRepository.findByCategoryId(categoryId);
    }

    /**
     * Fetch a random batch of questions as practice slots (the shape
     * practiceservice's QuestionServiceClient expects). Field names match
     * practiceservice's QuestionSlotDto 1:1 so Jackson deserialization works.
     */
    public List<QuestionSlotDto> getRandomQuestionSlots(UUID categoryId, String difficulty, int count) {
        return getRandomQuestions(categoryId, difficulty, count).stream()
                .map(this::toSlotDto)
                .collect(Collectors.toList());
    }

    /** Raw entity fetch (admin/debug). */
    public List<Question> getRandomQuestions(UUID categoryId, String difficulty, int count) {
        List<Question> pool;
        if (categoryId != null) {
            pool = questionRepository.findByCategoryId(categoryId);
        } else {
            pool = questionRepository.findAll();
        }
        if (difficulty != null && !difficulty.isBlank()) {
            pool = pool.stream()
                    .filter(q -> difficulty.equalsIgnoreCase(q.getDifficulty()))
                    .collect(Collectors.toList());
        }
        java.util.Collections.shuffle(pool);
        int n = Math.min(Math.max(count, 1), pool.size());
        return pool.subList(0, n);
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Category addCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Question addQuestion(Question question) {
        return questionRepository.save(question);
    }

    public boolean gradeQuestion(String id, GradeRequest request) {
        return true;
    }

    // ── Decks ────────────────────────────────────────────────────

    public List<DeckDto> getDecks() {
        return List.of();
    }

    /** Cursor-paginated questions for a deck. */
    public PaginatedQuestionsResponse getQuestionsByDeck(String deckId, String cursor, int limit) {
        int size = Math.min(Math.max(limit, 1), 100);
        Page<Question> page;
        if (cursor == null || cursor.isBlank()) {
            page = questionRepository.findAll(PageRequest.of(0, size));
        } else {
            UUID cursorId = UUID.fromString(cursor);
            page = questionRepository.findByIdGreaterThanOrderByIdAsc(cursorId, PageRequest.of(0, size));
        }

        List<QuestionDto> data = page.getContent().stream()
                .map(this::toQuestionDto)
                .collect(Collectors.toList());

        String nextCursor = page.hasNext() && !data.isEmpty()
                ? String.valueOf(data.get(data.size() - 1).getId())
                : null;

        return new PaginatedQuestionsResponse(data, nextCursor);
    }

    // ── Single question ──────────────────────────────────────────

    public QuestionDto getQuestion(String questionId) {
        Question q = questionRepository.findById(UUID.fromString(questionId))
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));
        return toQuestionDto(q);
    }

    /** Slot view for practiceservice (questionId / questionText / expectedKeywords). */
    public QuestionSlotDto getQuestionSlot(String questionId) {
        Question q = questionRepository.findById(UUID.fromString(questionId))
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));
        return toSlotDto(q);
    }

    // ── Sync ─────────────────────────────────────────────────────

    public SyncResponse sync(SyncRequest request) {
        int applied = request.getChanges() != null ? request.getChanges().size() : 0;
        return new SyncResponse(applied, List.of());
    }

    // ── helpers ──────────────────────────────────────────────────

    private QuestionDto toQuestionDto(Question q) {
        return QuestionDto.builder()
                .id(String.valueOf(q.getId()))
                .deckId(null)
                .title(q.getQuestion())
                .content(q.getSampleAnswer())
                .difficulty(q.getDifficulty())
                .hint(null)
                .category(q.getCategory() != null ? q.getCategory().getName() : null)
                .options(List.of())
                .bookmarked(false)
                .completed(false)
                .rating(null)
                .notes(null)
                .build();
    }

    /** Map to the practiceservice QuestionSlotDto shape (UUID questionId). */
    private QuestionSlotDto toSlotDto(Question q) {
        return new QuestionSlotDto(
                q.getId(),
                q.getQuestion(),
                List.of() // expectedKeywords not stored yet
        );
    }
}
