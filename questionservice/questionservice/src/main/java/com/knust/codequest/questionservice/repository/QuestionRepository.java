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

    /** Cursor-paginated fetch of questions whose id is greater than the cursor. */
    Page<Question> findByIdGreaterThanOrderByIdAsc(UUID cursor, Pageable pageable);
}
