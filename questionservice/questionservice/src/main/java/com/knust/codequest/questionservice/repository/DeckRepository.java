package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeckRepository extends JpaRepository<Deck, UUID> {

    /** All decks ordered by title — the default Library browse order. */
    List<Deck> findAllByOrderByTitleAsc();

    /** All decks in a category, ordered by title for stable display. */
    List<Deck> findByCategoryOrderByTitleAsc(String category);

    /** Lookup by title — used to keep seeds idempotent and for deep links. */
    Optional<Deck> findByTitle(String title);
}
