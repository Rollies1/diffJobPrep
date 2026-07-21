package com.jobprep.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * Analytics event from the frontend (paywall funnel).
 *
 * Per review: track the full funnel, not just "view" and "conversion":
 *   paywall_viewed, paywall_dismissed, purchase_started, purchase_failed,
 *   purchase_completed, restore_attempted, restore_succeeded
 *
 * The frontend sends these via POST /api/analytics/events.
 */
public record AnalyticsEventRequest(
    @NotBlank @Size(max = 64) String eventName,
    @Size(max = 64) String eventCategory,   // "paywall", "subscription", "practice"
    Map<String, Object> properties,         // event-specific data
    @Size(max = 64) String sessionId        // optional, for session-scoped events
) {}
