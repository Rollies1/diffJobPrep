package com.jobprep.session.client;

import com.jobprep.session.config.ServiceUrls;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Internal HTTP client for the notification service.
 *
 * sessionservice does NOT send pushes directly — it calls notificationservice's
 * internal batch endpoint. This keeps push delivery logic in one place.
 *
 * Auth: shared INTERNAL_API_KEY header. In production, use mTLS or a
 * service mesh for internal traffic.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationClient {

    private final ServiceUrls serviceUrls;

    /**
     * Send a push to a specific user's devices.
     *
     * @param userId  Recipient user ID.
     * @param type    Notification type (e.g. "streak_reminder").
     * @param title   Push title.
     * @param body    Push body.
     * @param data    Optional deep-link data.
     */
    public void sendToUser(String userId, String type, String title, String body, Map<String, Object> data) {
        var cfg = serviceUrls.getNotification();
        try {
            RestClient.create()
                .post()
                .uri(cfg.getBaseUrl() + "/api/notifications/internal/send")
                .header("X-Internal-Key", cfg.getApiKey())
                .header("Content-Type", "application/json")
                .body(Map.of(
                    "userId", userId,
                    "type", type,
                    "title", title,
                    "body", body,
                    "data", data != null ? data : Map.of()
                ))
                .retrieve()
                .toBodilessEntity();
            log.info("Sent push to user={} type={}", userId, type);
        } catch (Exception e) {
            log.error("Failed to send push to user={}: {}", userId, e.getMessage());
        }
    }

    /**
     * Batch send to multiple users (e.g. all users with active streaks).
     */
    public void sendBatch(List<String> userIds, String type, String title, String body) {
        for (String userId : userIds) {
            sendToUser(userId, type, title, body, Map.of());
        }
    }
}
