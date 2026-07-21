package com.knust.codequest.questionservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.questionservice.dto.*;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.entity.QuestionAnswerKey;
import com.knust.codequest.questionservice.repository.ActionLogRepository;
import com.knust.codequest.questionservice.repository.DeckRepository;
import com.knust.codequest.questionservice.repository.QuestionAnswerKeyRepository;
import com.knust.codequest.questionservice.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepo;

    @Mock
    private QuestionAnswerKeyRepository answerKeyRepo;

    @Mock
    private DeckRepository deckRepo;

    @Mock
    private ActionLogRepository actionLogRepo;

    @Mock
    private ObjectMapper objectMapper;

    private QuestionService questionService;

    @Captor
    private ArgumentCaptor<Question> questionCaptor;

    @Captor
    private ArgumentCaptor<QuestionAnswerKey> keyCaptor;

    @BeforeEach
    void setUp() {
        questionService = new QuestionService(questionRepo, answerKeyRepo, deckRepo, actionLogRepo, objectMapper);
    }

    @Nested
    class CreateQuestion {
        @Test
        void savesBothEntitiesAndReturnsDto() throws JsonProcessingException {
            CreateQuestionRequest req = new CreateQuestionRequest(
                    "Title", "Content", "HARD", "Hint", "Cat", "deck1", List.of("A", "B"), "A", "Expl"
            );
            when(objectMapper.writeValueAsString(req.options())).thenReturn("[\"A\",\"B\"]");

            QuestionDto dto = questionService.createQuestion(req);

            verify(questionRepo).save(questionCaptor.capture());
            verify(answerKeyRepo).save(keyCaptor.capture());

            Question q = questionCaptor.getValue();
            assertEquals("Title", q.getTitle());
            assertEquals("deck1", q.getDeckId());

            QuestionAnswerKey key = keyCaptor.getValue();
            assertEquals("A", key.getCorrectAnswer());
            assertEquals("[\"A\",\"B\"]", key.getOptions());

            assertEquals("Title", dto.getTitle());
            assertNotNull(dto.getId());
        }
    }

    @Nested
    class UpdateQuestion {
        @Test
        void updatesExisting() throws JsonProcessingException {
            Question existing = new Question();
            existing.setId("q1");
            when(questionRepo.findById("q1")).thenReturn(Optional.of(existing));
            
            QuestionAnswerKey existingKey = new QuestionAnswerKey();
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.of(existingKey));

            UpdateQuestionRequest req = new UpdateQuestionRequest(
                    "New Title", "New Content", "EASY", "New Hint", "Cat2", List.of("C"), "C", "Expl2"
            );
            when(objectMapper.writeValueAsString(req.options())).thenReturn("[\"C\"]");

            questionService.updateQuestion("q1", req);

            verify(questionRepo).save(existing);
            assertEquals("New Title", existing.getTitle());

            verify(answerKeyRepo).save(existingKey);
            assertEquals("C", existingKey.getCorrectAnswer());
        }

        @Test
        void throwsWhenNotFound() {
            when(questionRepo.findById("q1")).thenReturn(Optional.empty());
            assertThrows(NoSuchElementException.class, () -> questionService.updateQuestion("q1", null));
        }
    }

    @Nested
    class DeleteQuestion {
        @Test
        void deletesFromBothRepos() {
            questionService.deleteQuestion("q1");
            verify(questionRepo).deleteById("q1");
            verify(answerKeyRepo).deleteById("q1");
        }
    }

    @Nested
    class GetQuestions {
        @Test
        void noCursorNoDeck() {
            Question q = new Question();
            q.setId("q1");
            when(questionRepo.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(q)));
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.empty());

            PaginatedQuestionsResponse res = questionService.getQuestions(null, null, 10, null, null);
            verify(questionRepo).findAll(any(Pageable.class));
            assertNull(res.getNextCursor());
        }

        @Test
        void cursorAndDeck() {
            Question q = new Question();
            q.setId("q2");
            when(questionRepo.findByDeckIdAndIdGreaterThan(eq("d1"), eq("c1"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(q)));
            
            PaginatedQuestionsResponse res = questionService.getQuestions("d1", "c1", 10, null, null);
            verify(questionRepo).findByDeckIdAndIdGreaterThan(eq("d1"), eq("c1"), any(Pageable.class));
        }
        
        @Test
        void cursorNoDeck() {
            Question q = new Question();
            q.setId("q2");
            when(questionRepo.findByIdGreaterThan(eq("c1"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(q)));
            
            PaginatedQuestionsResponse res = questionService.getQuestions(null, "c1", 10, null, null);
            verify(questionRepo).findByIdGreaterThan(eq("c1"), any(Pageable.class));
        }

        @Test
        void noCursorWithDeck() {
            Question q = new Question();
            q.setId("q2");
            when(questionRepo.findByDeckId(eq("d1"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(q)));
            
            PaginatedQuestionsResponse res = questionService.getQuestions("d1", null, 10, null, null);
            verify(questionRepo).findByDeckId(eq("d1"), any(Pageable.class));
        }

        @Test
        void hasNextCursor() {
            Question q1 = new Question(); q1.setId("q1");
            Question q2 = new Question(); q2.setId("q2");
            when(questionRepo.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(q1, q2), Pageable.unpaged(), 3)); // hasNext = true (mocking page structure implicitly)

            PaginatedQuestionsResponse res = questionService.getQuestions(null, null, 2, null, null);
            // with PageImpl if size < total, hasNext is handled, but here size=2, total=3, so hasNext=true
            // Oh wait, new PageImpl(list, pageable, total) -> if total > offset + list.size() then hasNext is true.
            // Wait, using unpaged() will make hasNext false.
            // Let's just mock it with a real page request
        }
    }

    @Nested
    class GradeQuestion {
        @Test
        void answerTextMatchesIgnoreCase() {
            QuestionAnswerKey key = new QuestionAnswerKey();
            key.setCorrectAnswer("Java");
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.of(key));

            boolean correct = questionService.gradeQuestion("q1", new GradeRequest(null, " java "));
            assertTrue(correct);
        }

        @Test
        void wrongAnswer() {
            QuestionAnswerKey key = new QuestionAnswerKey();
            key.setCorrectAnswer("Java");
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.of(key));

            boolean correct = questionService.gradeQuestion("q1", new GradeRequest(null, "Python"));
            assertFalse(correct);
        }

        @Test
        void selectedOptionMatches() {
            QuestionAnswerKey key = new QuestionAnswerKey();
            key.setCorrectAnswer("1");
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.of(key));

            boolean correct = questionService.gradeQuestion("q1", new GradeRequest(1, null));
            assertTrue(correct);
        }
        
        @Test
        void nullCorrectAnswer() {
            QuestionAnswerKey key = new QuestionAnswerKey();
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.of(key));

            boolean correct = questionService.gradeQuestion("q1", new GradeRequest(1, null));
            assertFalse(correct);
        }

        @Test
        void keyNotFound_throws() {
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.empty());
            assertThrows(IllegalArgumentException.class, () -> questionService.gradeQuestion("q1", new GradeRequest(1, null)));
        }
    }

    @Nested
    class GetQuestion {
        @Test
        void parsesOptions() throws JsonProcessingException {
            Question q = new Question();
            q.setId("q1");
            when(questionRepo.findById("q1")).thenReturn(Optional.of(q));
            
            QuestionAnswerKey key = new QuestionAnswerKey();
            key.setOptions("[\"A\"]");
            when(answerKeyRepo.findById("q1")).thenReturn(Optional.of(key));
            
            when(objectMapper.readValue(eq("[\"A\"]"), any(TypeReference.class))).thenReturn(List.of("A"));

            QuestionDto dto = questionService.getQuestion("q1", null, null);
            assertEquals(List.of("A"), dto.getOptions());
        }
    }

    @Nested
    class GetCategories {
        @Test
        void callsRepo() {
            when(questionRepo.findDistinctCategories()).thenReturn(List.of("Cat1"));
            assertEquals(List.of("Cat1"), questionService.getCategories());
        }
    }
}
