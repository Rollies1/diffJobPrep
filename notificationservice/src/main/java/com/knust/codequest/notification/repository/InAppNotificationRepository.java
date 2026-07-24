package com.knust.codequest.notification.repository;

import com.knust.codequest.notification.entity.InAppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InAppNotificationRepository extends JpaRepository<InAppNotification, UUID> {

    /**
     * A user's inbox: notifications targeted at them (userId match) plus
     * all broadcast/system/dev messages. Ordered newest-first.
     */
    List<InAppNotification> findByUserIdOrAudienceInOrderByCreatedAtDesc(
        String userId, Collection<String> audiences);

    /**
     * Unread count for a user. Overridden with an explicit @Query because
     * the derived form countByUserIdOrAudienceInAndReadAtIsNull parses as
     * "userId = ? OR (audience IN ? AND readAt IS NULL)" — Spring Data
     * splits on Or before And — which would also count the user's already-
     * read targeted rows. We need "(userId = ? OR audience IN ?) AND
     * readAt IS NULL" so the explicit query is required.
     */
    @Query("select count(n) from InAppNotification n " +
           "where (n.userId = :userId or n.audience in :audiences) " +
           "and n.readAt is null")
    long countByUserIdOrAudienceInAndReadAtIsNull(
        @Param("userId") String userId,
        @Param("audiences") Collection<String> audiences);

    /** Total unread across all rows (admin/dev observability). */
    long countByReadAtIsNull();

    /**
     * Mark every targeted-to-user row as read. Does NOT touch broadcast
     * rows — those have userId=null. Returns the number of rows updated.
     */
    @Modifying
    @Query("update InAppNotification n set n.readAt = :now " +
           "where n.userId = :userId and n.readAt is null")
    int markAllReadForUser(@Param("userId") String userId, @Param("now") Instant now);
}
