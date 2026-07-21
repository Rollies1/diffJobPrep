package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.Question;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import com.knust.codequest.questionservice.config.TestcontainersConfig;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfig.class)
class QuestionRepositorySliceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private QuestionRepository questionRepository;

    @Test
    void findByDeckIdAndIdGreaterThan_returnsCorrectPage() {
        Question q1 = new Question();
        q1.setId("q1");
        q1.setDeckId("deck1");
        q1.setTitle("T1");
        q1.setContent("{}");
        entityManager.persist(q1);

        Question q2 = new Question();
        q2.setId("q2");
        q2.setDeckId("deck1");
        q2.setTitle("T2");
        q2.setContent("{}");
        entityManager.persist(q2);

        Question q3 = new Question();
        q3.setId("q3");
        q3.setDeckId("deck2");
        q3.setTitle("T3");
        q3.setContent("{}");
        entityManager.persist(q3);

        entityManager.flush();

        Page<Question> page = questionRepository.findByDeckIdAndIdGreaterThan(
                "deck1", "q0", PageRequest.of(0, 10, Sort.by("id").ascending()));

        assertEquals(2, page.getTotalElements());
        assertEquals("q1", page.getContent().get(0).getId());
        assertEquals("q2", page.getContent().get(1).getId());

        Page<Question> pageWithCursor = questionRepository.findByDeckIdAndIdGreaterThan(
                "deck1", "q1", PageRequest.of(0, 10, Sort.by("id").ascending()));

        assertEquals(1, pageWithCursor.getTotalElements());
        assertEquals("q2", pageWithCursor.getContent().get(0).getId());
    }

    @Test
    void findDistinctCategories_returnsOnlyUniqueNotNull() {
        Question q1 = new Question();
        q1.setId("q1");
        q1.setTitle("T1");
        q1.setCategory("CatA");
        q1.setContent("{}");
        entityManager.persist(q1);

        Question q2 = new Question();
        q2.setId("q2");
        q2.setTitle("T2");
        q2.setCategory("CatA"); // duplicate
        q2.setContent("{}");
        entityManager.persist(q2);

        Question q3 = new Question();
        q3.setId("q3");
        q3.setTitle("T3");
        q3.setCategory("CatB");
        q3.setContent("{}");
        entityManager.persist(q3);

        Question q4 = new Question();
        q4.setId("q4");
        q4.setTitle("T4");
        q4.setCategory(null); // should be ignored
        q4.setContent("{}");
        entityManager.persist(q4);

        entityManager.flush();

        List<String> categories = questionRepository.findDistinctCategories();

        assertEquals(2, categories.size());
        assertTrue(categories.contains("CatA"));
        assertTrue(categories.contains("CatB"));
    }

    @Test
    void modifyingQueries_workCorrectly() {
        Question q1 = new Question();
        q1.setId("q1");
        q1.setTitle("T1");
        q1.setDeckId("deck1");
        q1.setContent("{}");
        entityManager.persist(q1);

        Question q2 = new Question();
        q2.setId("q2");
        q2.setTitle("T2");
        q2.setDeckId("deck1");
        q2.setContent("{}");
        entityManager.persist(q2);

        entityManager.flush();
        entityManager.clear();

        questionRepository.clearDeckId("deck1");
        entityManager.flush();
        entityManager.clear();

        Question found1 = entityManager.find(Question.class, "q1");
        Question found2 = entityManager.find(Question.class, "q2");
        
        assertTrue(found1.getDeckId() == null);
        assertTrue(found2.getDeckId() == null);
    }
}
