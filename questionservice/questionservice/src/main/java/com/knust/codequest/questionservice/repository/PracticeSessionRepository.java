package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, UUID> {

    @Query("SELECT t.name, COUNT(DISTINCT s.question.questionId), AVG(s.score), AVG(s.timeSpentSec) " +
           "FROM PracticeSession s JOIN s.question q JOIN q.topics t " +
           "WHERE s.user.userId = :userId AND s.status = 'completed' " +
           "GROUP BY t.name")
    List<Object[]> getProgressByTopic(@Param("userId") UUID userId);

    List<PracticeSession> findByUserUserIdAndStatusOrderByCompletedAtDesc(UUID userId, String status);

    @Query(value = """
        SELECT DISTINCT DATE(started_at) as practice_date
        FROM sessions
        WHERE user_id = :userId AND status = 'completed'
        ORDER BY practice_date DESC
        """, nativeQuery = true)
    List<java.sql.Date> findPracticeDates(@Param("userId") UUID userId);

    // Keep helper query methods needed by SessionService
    List<PracticeSession> findByUserUserId(UUID userId);
    List<PracticeSession> findByQuestionQuestionId(UUID questionId);
    List<PracticeSession> findByStatus(String status);
}
