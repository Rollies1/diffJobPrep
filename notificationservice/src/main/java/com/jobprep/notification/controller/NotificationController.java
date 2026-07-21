package com.jobprep.notification.controller;

import com.jobprep.notification.dto.RegisterDeviceRequest;
import com.jobprep.notification.dto.SendTestPushRequest;
import com.jobprep.notification.entity.DeviceToken;
import com.jobprep.notification.service.NotificationService;
import com.jobprep.notification.service.ExpoPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Push notification endpoints.
 *
 * The X-User-Id header is set by the gateway's JwtAuthFilter after JWT
 * validation. Downstream services trust this header, not client-supplied
 * auth.
 *
 * Endpoints:
 *   POST   /api/notifications/register              — upsert a device token
 *   GET    /api/notifications/devices                — list active devices
 *   DELETE /api/notifications/devices/{deviceId}     — soft-delete (opt-out)
 *   POST   /api/notifications/test                   — send a test push
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

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
}
