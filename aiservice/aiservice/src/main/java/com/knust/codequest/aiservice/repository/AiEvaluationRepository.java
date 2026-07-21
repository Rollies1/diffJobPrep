package com.knust.codequest.aiservice.repository;

import com.knust.codequest.aiservice.model.AiEvaluationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiEvaluationRepository extends JpaRepository<AiEvaluationEntity, UUID> {
    Optional<AiEvaluationEntity> findBySessionIdAndPromptVersionAndStatus(UUID sessionId, String promptVersion, com.knust.codequest.aiservice.enums.EvaluationStatus status);
}
