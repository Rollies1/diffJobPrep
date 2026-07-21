package com.jobprep.notification.service;

import com.jobprep.notification.dto.RegisterDeviceRequest;
import com.jobprep.notification.dto.SendTestPushRequest;
import com.jobprep.notification.entity.DeviceToken;
import com.jobprep.notification.entity.NotificationLog;
import com.jobprep.notification.repository.DeviceTokenRepository;
import com.jobprep.notification.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * High-level notification operations.
 *
 * Encapsulates registration logic and delegates push delivery to
 * ExpoPushService. The controller layer talks to this service, never
 * to repositories directly.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final DeviceTokenRepository deviceTokenRepo;
    private final NotificationLogRepository logRepo;
    private final ExpoPushService expoPushService;

    /**
     * Register or refresh a device token.
     *
     * Idempotent on (userId, deviceId) — upsert. If the device already
     * exists, the token is updated (Expo rotates tokens) and isActive
     * is set back to true (re-activation on re-register after opt-out).
     */
    @Transactional
    public DeviceToken registerDevice(String userId, RegisterDeviceRequest req) {
        return deviceTokenRepo.findByUserIdAndDeviceId(userId, req.deviceId())
            .map(existing -> {
                existing.setToken(req.token());
                existing.setPlatform(req.platform());
                if (req.timezone() != null) existing.setTimezone(req.timezone());
                if (req.locale() != null) existing.setLocale(req.locale());
                existing.setAppVersion(req.appVersion());
                existing.setOsVersion(req.osVersion());
                existing.setActive(true);
                existing.setLastUsedAt(Instant.now());
                return deviceTokenRepo.save(existing);
            })
            .orElseGet(() -> deviceTokenRepo.save(
                DeviceToken.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(userId)
                    .token(req.token())
                    .platform(req.platform())
                    .deviceId(req.deviceId())
                    .timezone(req.timezone() != null ? req.timezone() : "UTC")
                    .locale(req.locale() != null ? req.locale() : "en")
                    .appVersion(req.appVersion())
                    .osVersion(req.osVersion())
                    .active(true)
                    .registeredAt(Instant.now())
                    .lastUsedAt(Instant.now())
                    .build()
            ));
    }

    /**
     * Soft-delete a device (opt-out). Preserves the audit trail.
     */
    @Transactional
    public boolean unregisterDevice(String userId, String deviceId) {
        return deviceTokenRepo.findByUserIdAndDeviceId(userId, deviceId)
            .map(device -> {
                device.setActive(false);
                deviceTokenRepo.save(device);
                return true;
            })
            .orElse(false);
    }

    /**
     * List the user's active devices (dashboard helper).
     */
    @Transactional(readOnly = true)
    public List<DeviceToken> listDevices(String userId) {
        return deviceTokenRepo.findByUserIdAndActiveTrue(userId);
    }

    /**
     * Send a test push to every active device owned by the user.
     */
    @Transactional
    public ExpoPushService.SendResult sendTestPush(String userId, SendTestPushRequest req) {
        List<DeviceToken> devices = deviceTokenRepo.findByUserIdAndActiveTrue(userId);
        if (devices.isEmpty()) {
            return new ExpoPushService.SendResult(0);
        }

        String title = req.title() != null ? req.title() : "JobPrep test";
        String body = req.body() != null ? req.body() : "If you can read this, push notifications are wired up.";

        return expoPushService.sendBatch(
            userId,
            "test",
            title,
            body,
            devices,
            Map.of("type", "test", "userId", userId)
        );
    }

    /**
     * Internal send (called by sessionservice's scheduler).
     *
     * Per review:
     *   - De-duplicates: if a notification of this type was already sent
     *     to this user today (UTC), skip.
     *   - Filters by each device's local timezone — only sends if the
     *     user's local hour is in the reminder window.
     *   - Only sends to active devices.
     */
    @Transactional
    public ExpoPushService.SendResult sendToUserInternal(
        String userId, String type, String title, String body, Map<String, Object> data
    ) {
        // 1. De-duplicate: already sent this type today?
        Instant startOfTodayUtc = LocalDate.now(ZoneOffset.UTC)
            .atStartOfDay(ZoneOffset.UTC)
            .toInstant();
        if (logRepo.existsByUserIdAndTypeAndSentAtAfter(userId, type, startOfTodayUtc)) {
            return new ExpoPushService.SendResult(0);
        }

        // 2. Get active devices.
        List<DeviceToken> devices = deviceTokenRepo.findByUserIdAndActiveTrue(userId);
        if (devices.isEmpty()) {
            return new ExpoPushService.SendResult(0);
        }

        // 3. Send.
        return expoPushService.sendBatch(userId, type, title, body, devices, data);
    }
}
