package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.ActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface ActionLogRepository extends JpaRepository<ActionLog, String> {

    @Query("SELECT a.actionId FROM ActionLog a WHERE a.userId = :userId AND a.actionId IN :incomingIds")
    Set<String> findExistingIds(@Param("userId") String userId, @Param("incomingIds") List<String> incomingIds);

    @Query("SELECT new com.knust.codequest.questionservice.dto.UserActivityDto(" +
           "a.actionType, " +
           "CAST(a.clientTimestamp AS string), " +
           "a.payload) " +
           "FROM ActionLog a " +
           "WHERE a.userId = :userId AND a.targetId = :targetId " +
           "ORDER BY a.clientTimestamp DESC")
    List<com.knust.codequest.questionservice.dto.UserActivityDto> findByUserIdAndTargetIdOrderByClientTimestampDesc(
        @Param("userId") String userId, 
        @Param("targetId") String targetId
    );
}
