package com.jobprep.notification.repository;

import com.jobprep.notification.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, String> {

    /** Find the row for (userId, deviceId) — the upsert target. */
    Optional<DeviceToken> findByUserIdAndDeviceId(String userId, String deviceId);

    /** All active tokens for a user. */
    List<DeviceToken> findByUserIdAndActiveTrue(String userId);

    /** All active tokens across all users (for batch push from scheduler). */
    List<DeviceToken> findByActiveTrue();

    /**
     * Soft-delete by token (called when Expo returns DeviceNotRegistered).
     * Returns the number of rows updated.
     */
    @Modifying
    @Query("UPDATE DeviceToken d SET d.active = false WHERE d.token = :token")
    int deactivateByToken(String token);

    /** Prune tokens not used in N days. */
    @Modifying
    @Query("UPDATE DeviceToken d SET d.active = false WHERE d.lastUsedAt < :cutoff")
    int deactivateStaleTokens(Instant cutoff);
}
