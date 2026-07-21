package com.knust.codequest.practiceservice.repository;

import com.knust.codequest.practiceservice.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {
    List<PracticeSession> findByUserId(Long userId);
}