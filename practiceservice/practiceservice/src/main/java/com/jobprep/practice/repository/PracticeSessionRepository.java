package com.jobprep.practice.repository;

import com.jobprep.practice.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, String> {
    List<PracticeSession> findByUserIdOrderByStartedAtDesc(String userId);
}
