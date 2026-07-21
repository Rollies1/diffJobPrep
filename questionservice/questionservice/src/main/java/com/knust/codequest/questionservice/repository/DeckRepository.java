package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeckRepository extends JpaRepository<Deck, String> {
}
