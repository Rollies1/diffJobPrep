package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.dto.DeckDto;
import com.knust.codequest.questionservice.entity.Deck;
import com.knust.codequest.questionservice.repository.DeckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeckService {
    private final DeckRepository deckRepository;

    public DeckService(DeckRepository deckRepository) {
        this.deckRepository = deckRepository;
    }

    public List<DeckDto> getAllDecks() {
        return deckRepository.findAll().stream().map(deck -> {
            DeckDto dto = new DeckDto();
            dto.setId(deck.getId());
            dto.setTitle(deck.getTitle());
            dto.setCategory(deck.getCategory());
            dto.setColor(deck.getColor());
            dto.setQuestionCount(deck.getQuestionCount());
            dto.setCompletedCount(0);
            return dto;
        }).collect(Collectors.toList());
    }
}
