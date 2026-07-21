-- JobPrep — Session service analytics table (Phase 5 addition)
--
-- Add this migration to your existing sessionservice Flyway migrations.
-- The `session` schema should already exist from Phase 2.

-- ─── Analytics events ───
-- Simple event log for paywall funnel and other product analytics.
-- For high-volume analytics, consider a dedicated store (PostHog, Mixpanel).
CREATE TABLE IF NOT EXISTS session.analytics_events (
    id              VARCHAR(36)   PRIMARY KEY,
    user_id         VARCHAR(64)   NOT NULL,
    event_name      VARCHAR(64)   NOT NULL,
    event_category  VARCHAR(64),
    properties      JSONB         NOT NULL DEFAULT '{}',
    session_id      VARCHAR(64),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user      ON session.analytics_events (user_id);
CREATE INDEX idx_analytics_name_time ON session.analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_category  ON session.analytics_events (event_category);
