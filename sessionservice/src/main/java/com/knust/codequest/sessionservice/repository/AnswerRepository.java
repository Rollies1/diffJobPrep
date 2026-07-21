package com.knust.codequest.sessionservice.repository;

import com.knust.codequest.sessionservice.entity.SessionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<SessionAnswer, UUID> {

    List<SessionAnswer> findBySessionIdOrderBySequenceNumberAsc(UUID sessionId);

    boolean existsBySessionIdAndQuestionId(UUID sessionId, UUID questionId);
}
