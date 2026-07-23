package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findByCategoryId(UUID categoryId);

    /** All questions belonging to a deck — used by deck-detail + deck practice. */
    List<Question> findByDeckId(UUID deckId);

    /** Deck + difficulty filter — used by the practice random-slot endpoint. */
    List<Question> findByDeckIdAndDifficultyIgnoreCase(UUID deckId, String difficulty);

    /** Cursor-paginated fetch of questions whose id is greater than the cursor. */
    Page<Question> findByIdGreaterThanOrderByIdAsc(UUID cursor, Pageable pageable);

    /** Cursor-paginated fetch within a single deck. */
    Page<Question> findByIdGreaterThanAndDeckIdOrderByIdAsc(UUID cursor, UUID deckId, Pageable pageable);

    /** First page within a deck (no cursor). */
    Page<Question> findByDeckIdOrderByIdAsc(UUID deckId, Pageable pageable);
}
