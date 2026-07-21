package com.knust.codequest.practiceservice.repository;

import com.knust.codequest.practiceservice.entity.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, UUID> {

    Optional<UserAnswer> findBySessionIdAndQuestionId(UUID sessionId, Long questionId);

    List<UserAnswer> findBySessionId(UUID sessionId);
}