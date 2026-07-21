package com.knust.codequest.sessionservice.repository;

import com.knust.codequest.sessionservice.entity.PracticeSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
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

    // ── History (cursor-paginated, newest first) ────────────────

    List<PracticeSession> findByUserIdAndStatusAndDeletedAtIsNullAndIdNotInOrderByIdDesc(
            String userId, PracticeSession.Status status, List<UUID> excludeIds, Pageable pageable);

    /** Newest-first completed sessions older than the cursor id. */
    List<PracticeSession> findByUserIdAndStatusAndDeletedAtIsNullAndIdLessThanOrderByIdDesc(
            String userId, PracticeSession.Status status, UUID cursor, Pageable pageable);

    /** Newest-first completed sessions (first page, no cursor). */
    List<PracticeSession> findByUserIdAndStatusAndDeletedAtIsNullOrderByIdDesc(
            String userId, PracticeSession.Status status, Pageable pageable);

    // ── Daily activity ──────────────────────────────────────────

    @Query("SELECT s FROM PracticeSession s WHERE s.userId = :userId AND s.status = 'COMPLETED' AND s.deletedAt IS NULL AND s.completedAt >= :since ORDER BY s.completedAt ASC")
    List<PracticeSession> findCompletedSince(@Param("userId") String userId, @Param("since") Instant since);

    // ── Streak (distinct completed days) ────────────────────────

    @Query("SELECT DISTINCT FUNCTION('date', s.completedAt) FROM PracticeSession s WHERE s.userId = :userId AND s.status = 'COMPLETED' AND s.deletedAt IS NULL AND s.completedAt IS NOT NULL ORDER BY FUNCTION('date', s.completedAt) DESC")
    List<java.sql.Date> findDistinctCompletedDays(@Param("userId") String userId);
}
