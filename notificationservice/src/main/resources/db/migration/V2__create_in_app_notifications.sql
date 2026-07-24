-- JobPrep — In-app notification message center (Task 2-backend)
-- Stores messages from dev/system to users (broadcast or targeted).
-- Read by the mobile app's home bell + Notifications screen.

CREATE TABLE IF NOT EXISTS notification.in_app_notifications (
    id              UUID          PRIMARY KEY,
    user_id         VARCHAR(64),                       -- null = broadcast
    audience        VARCHAR(16)   NOT NULL,            -- USER|BROADCAST|SYSTEM|DEV
    type            VARCHAR(64)   NOT NULL,            -- system|dev|tutor|achievement|streak|deck|...
    title           VARCHAR(256)  NOT NULL,
    body            VARCHAR(1024) NOT NULL,
    emoji           VARCHAR(32),
    avatar          VARCHAR(64),
    cta             VARCHAR(64),                       -- call-to-action label
    target_screen   VARCHAR(64),                       -- deep-link screen name
    target_params   TEXT,                              -- JSON string of params
    read_at         TIMESTAMPTZ,                       -- null until opened
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ                        -- null = never expires
);

CREATE INDEX IF NOT EXISTS idx_inapp_user_created
    ON notification.in_app_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inapp_audience_created
    ON notification.in_app_notifications (audience, created_at DESC);
