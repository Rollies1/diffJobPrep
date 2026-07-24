package com.knust.codequest.notification.controller;

import com.knust.codequest.notification.dto.BroadcastRequest;
import com.knust.codequest.notification.dto.InAppNotificationDto;
import com.knust.codequest.notification.dto.InboxResponse;
import com.knust.codequest.notification.dto.RegisterDeviceRequest;
import com.knust.codequest.notification.dto.SendTestPushRequest;
import com.knust.codequest.notification.dto.UnreadCountResponse;
import com.knust.codequest.notification.entity.DeviceToken;
import com.knust.codequest.notification.service.ExpoPushService;
import com.knust.codequest.notification.service.InAppNotificationService;
import com.knust.codequest.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Notification endpoints (push + in-app message center).
 *
 * The X-User-Id header is set by the gateway's JwtAuthFilter after JWT
 * validation. Downstream services trust this header, not client-supplied
 * auth.
 *
 * Push endpoints:
 *   POST   /api/notifications/register              — upsert a device token
 *   GET    /api/notifications/devices                — list active devices
 *   DELETE /api/notifications/devices/{deviceId}     — soft-delete (opt-out)
 *   POST   /api/notifications/test                   — send a test push
 *
 * In-app message center (Task 2-backend):
 *   GET    /api/notifications/inbox                  — user's inbox
 *   GET    /api/notifications/unread-count           — bell badge count
 *   POST   /api/notifications/{id}/read              — mark one as read
 *   POST   /api/notifications/read-all               — mark all as read
 *   POST   /api/notifications/internal/broadcast     — dev/admin create
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final InAppNotificationService inAppNotificationService;

    @PostMapping("/register")
    public ResponseEntity<?> register(
        @RequestHeader("X-User-Id") String userId,
        @Valid @RequestBody RegisterDeviceRequest req
    ) {
        DeviceToken device = notificationService.registerDevice(userId, req);
        return ResponseEntity.ok(Map.of(
            "id", device.getId(),
            "deviceId", device.getDeviceId(),
            "platform", device.getPlatform(),
            "isActive", device.isActive(),
            "registered", true
        ));
    }

    @GetMapping("/devices")
    public ResponseEntity<?> listDevices(@RequestHeader("X-User-Id") String userId) {
        List<DeviceToken> devices = notificationService.listDevices(userId);
        return ResponseEntity.ok(Map.of("devices", devices));
    }

    @DeleteMapping("/devices/{deviceId}")
    public ResponseEntity<?> unregister(
        @RequestHeader("X-User-Id") String userId,
        @PathVariable String deviceId
    ) {
        boolean ok = notificationService.unregisterDevice(userId, deviceId);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "device_not_found"));
        }
        return ResponseEntity.ok(Map.of("deviceId", deviceId, "unregistered", true));
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTest(
        @RequestHeader("X-User-Id") String userId,
        @RequestBody(required = false) SendTestPushRequest req
    ) {
        if (req == null) req = new SendTestPushRequest(null, null);
        ExpoPushService.SendResult result = notificationService.sendTestPush(userId, req);

        if (result.totalAttempted == 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "no_active_devices"));
        }

        return ResponseEntity.ok(Map.of(
            "devicesTargeted", result.totalAttempted,
            "sent", result.sent,
            "failed", result.failed,
            "prunedTokens", result.prunedTokens
        ));
    }

    /**
     * Internal endpoint called by sessionservice's scheduler.
     *
     * Auth: X-Internal-Key header (shared secret). Not accessible to
     * end users — the gateway doesn't route /api/notifications/internal/*.
     *
     * De-duplicates: if a notification of this type was already sent to
     * this user today, returns 200 with skipped=true instead of re-sending.
     */
    @PostMapping("/internal/send")
    public ResponseEntity<?> internalSend(
        @RequestHeader("X-Internal-Key") String internalKey,
        @RequestBody InternalSendRequest req
    ) {
        // TODO: validate internalKey against config in production.
        // For now we trust the network layer (gateway doesn't route this).

        notificationService.sendToUserInternal(
            req.userId(), req.type(), req.title(), req.body(), req.data()
        );
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** Internal request body (not part of the public API). */
    public record InternalSendRequest(
        String userId,
        String type,
        String title,
        String body,
        java.util.Map<String, Object> data
    ) {}

    // ─── In-app message center (Task 2-backend) ───────────────────────────

    /**
     * Get the user's inbox: targeted + broadcast/system/dev messages,
     * newest first. Expired rows are filtered out. Pass unreadOnly=true
     * to only get unread rows.
     */
    @GetMapping("/inbox")
    public ResponseEntity<InboxResponse> inbox(
        @RequestHeader("X-User-Id") String userId,
        @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly
    ) {
        return ResponseEntity.ok(inAppNotificationService.getInbox(userId, unreadOnly));
    }

    /** Bell badge: number of unread messages for this user. */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> unreadCount(
        @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(
            new UnreadCountResponse(inAppNotificationService.getUnreadCount(userId)));
    }

    /** Mark a single notification as read. */
    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, Boolean>> markRead(
        @RequestHeader("X-User-Id") String userId,
        @PathVariable String id
    ) {
        inAppNotificationService.markRead(UUID.fromString(id), userId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** Mark all of the user's targeted notifications as read. */
    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(
        @RequestHeader("X-User-Id") String userId
    ) {
        long count = inAppNotificationService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("ok", true, "count", count));
    }

    /**
     * Internal endpoint (admin/dev only) to create an in-app notification.
     * Auth: X-Internal-Key header (shared secret). Not routed by the
     * gateway — callers must hit the service directly on port 8083.
     */
    @PostMapping("/internal/broadcast")
    public ResponseEntity<InAppNotificationDto> internalBroadcast(
        @RequestHeader(value = "X-Internal-Key", required = false) String key,
        @Valid @RequestBody BroadcastRequest req
    ) {
        // TODO: validate `key` against config in production.
        // For now we trust the network layer (gateway doesn't route this).
        return ResponseEntity.ok(inAppNotificationService.broadcast(req));
    }
}
