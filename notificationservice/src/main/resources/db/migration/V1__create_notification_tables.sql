-- JobPrep — Notification service schema
-- Per review: separate schema so this service can be extracted/scaled
-- independently without touching other services' tables.

CREATE SCHEMA IF NOT EXISTS notification;

-- ─── Device tokens ───
-- Unique on (user_id, device_id) → upsert target.
-- Unique on token → auto-pruning by token is safe.
CREATE TABLE notification.device_tokens (
    id              VARCHAR(36)   PRIMARY KEY,
    user_id         VARCHAR(64)   NOT NULL,
    token           VARCHAR(512)  NOT NULL,
    platform        VARCHAR(16)   NOT NULL CHECK (platform IN ('ios','android','web')),
    device_id       VARCHAR(128)  NOT NULL,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    timezone        VARCHAR(64)   NOT NULL DEFAULT 'UTC',
    locale          VARCHAR(16)   NOT NULL DEFAULT 'en',
    app_version     VARCHAR(32),
    os_version      VARCHAR(32),
    registered_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_device UNIQUE (user_id, device_id),
    CONSTRAINT uk_token UNIQUE (token)
);

CREATE INDEX idx_device_tokens_user   ON notification.device_tokens (user_id);
CREATE INDEX idx_device_tokens_active ON notification.device_tokens (is_active);

-- ─── Notification audit log ───
CREATE TABLE notification.notification_logs (
    id              VARCHAR(36)   PRIMARY KEY,
    user_id         VARCHAR(64)   NOT NULL,
    type            VARCHAR(32)   NOT NULL,
    title           VARCHAR(256)  NOT NULL,
    body            VARCHAR(1024) NOT NULL,
    status          VARCHAR(16)   NOT NULL CHECK (status IN ('sent','failed','rejected')),
    expo_ticket_id  VARCHAR(128),
    error_details   VARCHAR(1024),
    sent_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_type_sent ON notification.notification_logs (user_id, type, sent_at);
CREATE INDEX idx_notif_sent           ON notification.notification_logs (sent_at);
