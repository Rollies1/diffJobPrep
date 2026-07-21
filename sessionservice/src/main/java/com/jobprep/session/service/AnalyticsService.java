package com.jobprep.session.service;

import com.jobprep.session.dto.AnalyticsEventRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Analytics service.
 *
 * Per review: use direct HTTP (not Kafka) for internal events — same
 * pattern as the notification service from Phase 2. Kafka is overkill
 * unless you already have it.
 *
 * Events are stored in a simple `analytics_events` table. For high-volume
 * analytics, consider a dedicated analytics store (PostHog, Mixpanel,
 * BigQuery) — but this is fine for MVP.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void recordEvent(String userId, AnalyticsEventRequest event) {
        String sql = """
            INSERT INTO session.analytics_events
                (id, user_id, event_name, event_category, properties, session_id, created_at)
            VALUES (?, ?, ?, ?, ?::jsonb, ?, ?)
            """;

        String propertiesJson = event.properties() != null
            ? toJson(event.properties())
            : "{}";

        jdbcTemplate.update(sql,
            UUID.randomUUID().toString(),
            userId,
            event.eventName(),
            event.eventCategory() != null ? event.eventCategory() : "uncategorized",
            propertiesJson,
            event.sessionId(),
            Instant.now()
        );

        log.debug("Recorded analytics event: user={}, event={}", userId, event.eventName());
    }

    /**
     * Minimal JSON serialization (use ObjectMapper in production).
     */
    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (var entry : map.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(entry.getKey()).append("\":");
            Object v = entry.getValue();
            if (v instanceof String s) {
                sb.append("\"").append(s.replace("\"", "\\\"")).append("\"");
            } else if (v instanceof Number || v instanceof Boolean) {
                sb.append(v);
            } else {
                sb.append("\"").append(v).append("\"");
            }
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }
}
