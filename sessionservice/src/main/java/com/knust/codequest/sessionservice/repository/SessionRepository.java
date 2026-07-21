package com.knust.codequest.sessionservice.repository;

import com.knust.codequest.sessionservice.model.PracticeSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<PracticeSession, UUID> {

    Page<PracticeSession> findByUserIdAndDeletedAtIsNull(String userId, Pageable pageable);

    List<PracticeSession> findByUserIdAndStatusAndDeletedAtIsNull(String userId, PracticeSession.Status status);

    Optional<PracticeSession> findByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT COUNT(s) FROM PracticeSession s WHERE s.userId = :userId AND s.status = 'COMPLETED' AND s.deletedAt IS NULL")
    long countCompletedByUser(@Param("userId") String userId);

    @Query("SELECT AVG(s.overallScore) FROM PracticeSession s WHERE s.userId = :userId AND s.status = 'COMPLETED' AND s.deletedAt IS NULL")
    Double averageScoreByUser(@Param("userId") String userId);
}
