package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.QuestionAnswerKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionAnswerKeyRepository extends JpaRepository<QuestionAnswerKey, String> {
}
