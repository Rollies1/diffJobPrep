package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.dto.DeckDto;
import com.knust.codequest.questionservice.entity.Deck;
import com.knust.codequest.questionservice.repository.DeckRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeckServiceTest {

    @Mock
    private DeckRepository deckRepository;

    private DeckService deckService;

    @BeforeEach
    void setUp() {
        deckService = new DeckService(deckRepository);
    }

    @Test
    void getAllDecks_withDecks_returnsMappedDtos() {
        Deck deck1 = new Deck();
        deck1.setId("java-basics");
        deck1.setTitle("Java Basics");
        deck1.setCategory("Language");
        deck1.setColor("#ffffff");
        deck1.setQuestionCount(10);

        Deck deck2 = new Deck();
        deck2.setId("spring-boot");
        deck2.setTitle("Spring Boot");
        deck2.setCategory("Framework");
        deck2.setColor("#000000");
        deck2.setQuestionCount(5);

        when(deckRepository.findAll()).thenReturn(List.of(deck1, deck2));

        List<DeckDto> result = deckService.getAllDecks();

        assertEquals(2, result.size());

        DeckDto dto1 = result.get(0);
        assertEquals("java-basics", dto1.getId());
        assertEquals("Java Basics", dto1.getTitle());
        assertEquals("Language", dto1.getCategory());
        assertEquals("#ffffff", dto1.getColor());
        assertEquals(10, dto1.getQuestionCount());
        assertEquals(0, dto1.getCompletedCount());

        DeckDto dto2 = result.get(1);
        assertEquals("spring-boot", dto2.getId());
        assertEquals("Spring Boot", dto2.getTitle());
        assertEquals("Framework", dto2.getCategory());
        assertEquals("#000000", dto2.getColor());
        assertEquals(5, dto2.getQuestionCount());
        assertEquals(0, dto2.getCompletedCount());
    }

    @Test
    void getAllDecks_withEmpty_returnsEmptyList() {
        when(deckRepository.findAll()).thenReturn(List.of());

        List<DeckDto> result = deckService.getAllDecks();

        assertTrue(result.isEmpty());
    }
}
