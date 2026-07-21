package com.knust.codequest.notification.repository;

import com.knust.codequest.notification.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, String> {

    /** Did we already send a notification of this type to this user since `since`? */
    boolean existsByUserIdAndTypeAndSentAtAfter(String userId, String type, Instant since);

    /** Recent logs for observability / dashboard. */
    List<NotificationLog> findTop20ByUserIdOrderBySentAtDesc(String userId);
}
