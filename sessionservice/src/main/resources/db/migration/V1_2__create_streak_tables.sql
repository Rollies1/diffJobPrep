-- JobPrep — Session service schema
-- Owns streak tracking and the ShedLock table.

CREATE SCHEMA IF NOT EXISTS session;

-- ─── User streaks ───
CREATE TABLE session.user_streaks (
    user_id             VARCHAR(64)   PRIMARY KEY,
    streak_count        INTEGER       NOT NULL DEFAULT 0,
    last_practice_date  DATE,
    is_active           BOOLEAN       NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_streak_active ON session.user_streaks (is_active);
CREATE INDEX idx_streak_user   ON session.user_streaks (user_id);

-- ─── ShedLock table ───
-- Ensures @Scheduled tasks fire on exactly one instance.
-- See: https://github.com/lukas-krecan/ShedLock
CREATE TABLE session.shedlock (
    name       VARCHAR(64)  PRIMARY KEY,
    lock_until TIMESTAMPTZ  NOT NULL,
    locked_at  TIMESTAMPTZ  NOT NULL,
    locked_by  VARCHAR(255) NOT NULL
);
