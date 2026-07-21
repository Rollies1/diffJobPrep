package com.jobprep.session.controller;

import com.jobprep.session.dto.AnalyticsEventRequest;
import com.jobprep.session.service.AnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Analytics endpoint.
 *
 * POST /api/analytics/events
 *
 * Called by the frontend to log paywall funnel events:
 *   paywall_viewed, paywall_dismissed, purchase_started,
 *   purchase_failed, purchase_completed, restore_attempted
 *
 * Also called internally by authservice when a subscription changes
 * (via the internal endpoint below).
 *
 * The X-User-Id header is set by the gateway's JwtAuthFilter.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Record an analytics event from the frontend.
     */
    @PostMapping("/events")
    public ResponseEntity<?> recordEvent(
        @RequestHeader("X-User-Id") String userId,
        @Valid @RequestBody AnalyticsEventRequest event
    ) {
        analyticsService.recordEvent(userId, event);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /**
     * Internal endpoint: authservice calls this when a subscription
     * changes (e.g., INITIAL_PURCHASE → log "premium_conversion" event).
     *
     * Auth: X-Internal-Key header (shared secret between services).
     */
    @PostMapping("/internal/subscription-event")
    public ResponseEntity<?> recordSubscriptionEvent(
        @RequestHeader("X-Internal-Key") String internalKey,
        @RequestBody Map<String, Object> body
    ) {
        // TODO: validate internalKey against config.
        String userId = (String) body.get("userId");
        String eventType = (String) body.get("eventType");

        analyticsService.recordEvent(userId, new AnalyticsEventRequest(
            "subscription_" + eventType.toLowerCase(),
            "subscription",
            body,
            null
        ));

        return ResponseEntity.ok(Map.of("ok", true));
    }
}
