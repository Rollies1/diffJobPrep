package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.UserQuestionState;
import com.knust.codequest.questionservice.entity.UserQuestionStateId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserQuestionStateRepository extends JpaRepository<UserQuestionState, UserQuestionStateId> {
    Optional<UserQuestionState> findByUserIdAndQuestionIdAndDeviceId(String userId, String questionId, String deviceId);
    List<UserQuestionState> findByUserId(String userId);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserQuestionState u WHERE u.userId = :userId AND (u.deviceId = :deviceId OR :deviceId IS NULL) ORDER BY u.lastPracticedAt ASC NULLS FIRST")
    List<UserQuestionState> findDueQuestions(
        @org.springframework.data.repository.query.Param("userId") String userId, 
        @org.springframework.data.repository.query.Param("deviceId") String deviceId, 
        org.springframework.data.domain.Pageable pageable
    );
}
