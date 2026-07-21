-- JobPrep — Idempotency keys table
-- Per review: separate table, NOT a column on session_answers.
-- Unique on (user_id, key) → race-condition safe via ON CONFLICT.

CREATE TABLE practice.idempotency_keys (
    id              VARCHAR(36)   PRIMARY KEY,
    user_id         VARCHAR(64)   NOT NULL,
    key             VARCHAR(128)  NOT NULL,
    request_hash    VARCHAR(64)   NOT NULL,  -- SHA-256 of canonical body
    response_status INTEGER       NOT NULL,
    response_body   TEXT          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ   NOT NULL,
    CONSTRAINT uk_user_key UNIQUE (user_id, key)
);

CREATE INDEX idx_idem_expires ON practice.idempotency_keys (expires_at);
