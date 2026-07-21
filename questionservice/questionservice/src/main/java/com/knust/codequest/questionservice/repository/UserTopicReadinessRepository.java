package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.UserTopicReadiness;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserTopicReadinessRepository extends JpaRepository<UserTopicReadiness, Long> {

    List<UserTopicReadiness> findByUserUserId(UUID userId);

    Optional<UserTopicReadiness> findByUserUserIdAndTopicTopicId(UUID userId, Integer topicId);

    boolean existsByUserUserIdAndTopicTopicId(UUID userId, Integer topicId);
}
