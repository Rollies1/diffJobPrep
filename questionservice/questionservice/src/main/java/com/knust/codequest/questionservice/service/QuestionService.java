package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.dto.*;
import com.knust.codequest.questionservice.entity.Category;
import com.knust.codequest.questionservice.entity.Deck;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.repository.CategoryRepository;
import com.knust.codequest.questionservice.repository.DeckRepository;
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
    private final DeckRepository deckRepository;

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
        return getRandomQuestions(categoryId, null, difficulty, count).stream()
                .map(this::toSlotDto)
                .collect(Collectors.toList());
    }

    /**
     * Deck-scoped random slots. When a deckId is supplied the pool is restricted
     * to that deck (optionally filtered by difficulty), which is what the
     * frontend PracticeSetupScreen "quick practice" + deck-start flows need.
     */
    public List<QuestionSlotDto> getRandomQuestionSlotsByDeck(UUID deckId, String difficulty, int count) {
        List<Question> pool = difficulty == null || difficulty.isBlank()
                ? questionRepository.findByDeckId(deckId)
                : questionRepository.findByDeckIdAndDifficultyIgnoreCase(deckId, difficulty);
        java.util.Collections.shuffle(pool);
        int n = Math.min(Math.max(count, 1), pool.size());
        return pool.subList(0, n).stream().map(this::toSlotDto).collect(Collectors.toList());
    }

    /** Raw entity fetch (admin/debug). */
    public List<Question> getRandomQuestions(UUID categoryId, String difficulty, int count) {
        return getRandomQuestions(categoryId, null, difficulty, count);
    }

    /**
     * Unified random fetch. Either {@code deckId} or {@code categoryId} scopes
     * the pool; if both are null the whole bank is used. This keeps the legacy
     * /api/questions/random contract intact while enabling deck-based practice.
     */
    public List<Question> getRandomQuestions(UUID categoryId, UUID deckId, String difficulty, int count) {
        List<Question> pool;
        if (deckId != null) {
            pool = questionRepository.findByDeckId(deckId);
        } else if (categoryId != null) {
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

    /**
     * All decks, ordered by title. The frontend Library screens and the
     * PracticeSetupScreen quick-start carousel both consume this list.
     * {@code completedCount} is 0 here because per-user progress is owned by
     * sessionservice; the frontend overlays progress from its local SQLite.
     */
    public List<DeckDto> getDecks() {
        return deckRepository.findAllByOrderByTitleAsc().stream()
                .map(this::toDeckDto)
                .collect(Collectors.toList());
    }

    /** Single deck by id — used by deck-start + deep links. */
    public DeckDto getDeck(UUID deckId) {
        return deckRepository.findById(deckId)
                .map(this::toDeckDto)
                .orElseThrow(() -> new RuntimeException("Deck not found: " + deckId));
    }

    /**
     * Cursor-paginated questions for a deck. The cursor is the last question's
     * UUID; the next page fetches questions with id &gt; cursor within the deck.
     * Falls back to the legacy all-questions pagination if the deckId is blank.
     */
    public PaginatedQuestionsResponse getQuestionsByDeck(String deckId, String cursor, int limit) {
        int size = Math.min(Math.max(limit, 1), 100);
        Page<Question> page;

        if (deckId != null && !deckId.isBlank()) {
            UUID deckUuid = UUID.fromString(deckId);
            if (cursor == null || cursor.isBlank()) {
                page = questionRepository.findByDeckIdOrderByIdAsc(deckUuid, PageRequest.of(0, size));
            } else {
                page = questionRepository.findByIdGreaterThanAndDeckIdOrderByIdAsc(
                        UUID.fromString(cursor), deckUuid, PageRequest.of(0, size));
            }
        } else if (cursor == null || cursor.isBlank()) {
            page = questionRepository.findAll(PageRequest.of(0, size));
        } else {
            page = questionRepository.findByIdGreaterThanOrderByIdAsc(UUID.fromString(cursor), PageRequest.of(0, size));
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

    private DeckDto toDeckDto(Deck d) {
        return DeckDto.builder()
                .id(String.valueOf(d.getId()))
                .title(d.getTitle())
                .category(d.getCategory())
                .color(d.getColorHex())
                .questionCount(d.getQuestionCount())
                // Per-user completion is owned by sessionservice; the frontend
                // overlays progress from its local SQLite, so we surface 0 here.
                .completedCount(0)
                .build();
    }

    private QuestionDto toQuestionDto(Question q) {
        return QuestionDto.builder()
                .id(String.valueOf(q.getId()))
                .deckId(q.getDeck() != null ? String.valueOf(q.getDeck().getId()) : null)
                .title(q.getTitle() != null ? q.getTitle() : q.getQuestion())
                .content(q.getQuestion())
                .difficulty(q.getDifficulty())
                .hint(q.getHint())
                .category(q.getCategory() != null ? q.getCategory().getName() : null)
                .subTopic(q.getSubTopic())
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
