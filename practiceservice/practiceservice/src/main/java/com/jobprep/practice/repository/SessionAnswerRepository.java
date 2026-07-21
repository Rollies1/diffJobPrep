package com.jobprep.practice.repository;

import com.jobprep.practice.entity.SessionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SessionAnswerRepository extends JpaRepository<SessionAnswer, String> {
    List<SessionAnswer> findBySessionIdOrderByAnsweredAtAsc(String sessionId);
}
