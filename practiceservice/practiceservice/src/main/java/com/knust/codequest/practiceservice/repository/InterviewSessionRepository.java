package com.knust.codequest.practiceservice.repository;

import com.knust.codequest.practiceservice.entity.InterviewSession;
import com.knust.codequest.practiceservice.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {

    List<InterviewSession> findByUserIdOrderByStartTimeDesc(UUID userId);

    List<InterviewSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    @Query("SELECT COUNT(ua) FROM UserAnswer ua WHERE ua.session.id = :sessionId")
    Long countAnswersBySessionId(@Param("sessionId") UUID sessionId);
}
