package com.knust.codequest.notification.service;

import com.knust.codequest.notification.config.ExpoProperties;
import com.knust.codequest.notification.entity.DeviceToken;
import com.knust.codequest.notification.entity.NotificationLog;
import com.knust.codequest.notification.repository.DeviceTokenRepository;
import com.knust.codequest.notification.repository.NotificationLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;

/**
 * Expo Push Notification service.
 *
 * Per review:
 *   - Chunks into batches of <=100 (Expo hard limit).
 *   - Uses Expo access token if configured (higher quotas, receipt fetch).
 *   - Deletes DeviceNotRegistered tokens on failure (auto-pruning).
 *   - Fetches receipts for delivery confirmation (best-effort, logged).
 *   - Logs every push to NotificationLog for observability.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpoPushService {

    private final ExpoProperties props;
    private final DeviceTokenRepository deviceTokenRepo;
    private final NotificationLogRepository logRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Send the same message to every token in `tokens`.
     *
     * @param userId    The user who owns the push (for logging).
     * @param type      Notification type (e.g. "streak_reminder", "test").
     * @param title     Notification title.
     * @param body      Notification body.
     * @param tokens    Device tokens to send to.
     * @param data      Optional deep-link data payload.
     * @return Aggregate result.
     */
    @Transactional
    public SendResult sendBatch(
        String userId,
        String type,
        String title,
        String body,
        List<DeviceToken> tokens,
        Map<String, Object> data
    ) {
        SendResult result = new SendResult(tokens.size());

        if (tokens.isEmpty()) return result;

        // Chunk into batches of `batchSize`.
        for (int i = 0; i < tokens.size(); i += props.getBatchSize()) {
            List<DeviceToken> chunk = tokens.subList(i, Math.min(i + props.getBatchSize(), tokens.size()));
            List<Map<String, Object>> messages = new ArrayList<>();
            for (DeviceToken d : chunk) {
                messages.add(buildMessage(d.getToken(), title, body, data));
            }
            processBatch(userId, type, title, body, chunk, messages, result);
        }

        return result;
    }

    private Map<String, Object> buildMessage(String to, String title, String body, Map<String, Object> data) {
        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("to", to);
        msg.put("title", title);
        msg.put("body", body);
        msg.put("sound", "default");
        msg.put("priority", "high");
        if (data != null) msg.put("data", data);
        return msg;
    }

    private void processBatch(
        String userId, String type, String title, String body,
        List<DeviceToken> chunk, List<Map<String, Object>> messages,
        SendResult result
    ) {
        try {
            String responseJson = RestClient.create()
                .post()
                .uri(props.getPushUrl())
                .headers(h -> {
                    h.set("Content-Type", "application/json");
                    h.set("Accept", "application/json");
                    h.set("Accept-Encoding", "gzip, deflate");
                    if (!props.getAccessToken().isBlank()) {
                        h.setBearerAuth(props.getAccessToken());
                    }
                })
                .body(messages)
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode dataArray = root.path("data");

            for (int i = 0; i < dataArray.size(); i++) {
                JsonNode ticket = dataArray.get(i);
                String status = ticket.path("status").asText();
                DeviceToken device = chunk.get(i);

                if ("ok".equals(status)) {
                    result.sent++;
                    String ticketId = ticket.path("id").asText(null);
                    logNotification(userId, type, title, body, "sent", ticketId, null);
                } else {
                    result.failed++;
                    String errorMsg = ticket.path("message").asText("unknown error");
                    String errorCode = ticket.path("details").path("error").asText("");

                    // Auto-prune dead tokens.
                    if ("DeviceNotRegistered".equals(errorCode)) {
                        int pruned = deviceTokenRepo.deactivateByToken(device.getToken());
                        result.prunedTokens += pruned;
                        log.info("Pruned {} dead token(s) for user={}", pruned, userId);
                    }

                    logNotification(userId, type, title, body, "failed", null, errorMsg);
                }
            }
        } catch (Exception e) {
            log.error("Expo batch failed for user={}: {}", userId, e.getMessage());
            result.failed += chunk.size();
            for (DeviceToken d : chunk) {
                logNotification(userId, type, title, body, "failed", null, e.getMessage());
            }
        }
    }

    private void logNotification(String userId, String type, String title, String body,
                                  String status, String ticketId, String error) {
        try {
            logRepo.save(NotificationLog.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .status(status)
                .expoTicketId(ticketId)
                .errorDetails(error != null && error.length() > 1024 ? error.substring(0, 1024) : error)
                .sentAt(Instant.now())
                .build());
        } catch (Exception e) {
            log.warn("Failed to log notification: {}", e.getMessage());
        }
    }

    /**
     * Best-effort receipt fetch. Expo returns delivery confirmations
     * asynchronously after a push; we log failures.
     */
    public void fetchReceipts(List<String> ticketIds) {
        if (ticketIds.isEmpty() || props.getAccessToken().isBlank()) return;
        try {
            String json = RestClient.create()
                .post()
                .uri(props.getReceiptUrl())
                .headers(h -> {
                    h.set("Content-Type", "application/json");
                    h.setBearerAuth(props.getAccessToken());
                })
                .body(Map.of("ids", ticketIds))
                .retrieve()
                .body(String.class);
            log.debug("Receipts: {}", json);
        } catch (Exception e) {
            log.debug("Receipt fetch failed (non-fatal): {}", e.getMessage());
        }
    }

    public static class SendResult {
        public final int totalAttempted;
        public int sent = 0;
        public int failed = 0;
        public int prunedTokens = 0;

        public SendResult(int totalAttempted) {
            this.totalAttempted = totalAttempted;
        }
    }
}
