-- JobPrep — Practice service schema
-- Owns practice sessions, answers, and idempotency keys.

CREATE SCHEMA IF NOT EXISTS practice;

-- ─── Practice sessions ───
CREATE TABLE practice.practice_sessions (
    id              VARCHAR(36)   PRIMARY KEY,
    user_id         VARCHAR(64)   NOT NULL,
    topic           VARCHAR(128),
    started_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    streak_at_start INTEGER       NOT NULL DEFAULT 0
);

CREATE INDEX idx_session_user    ON practice.practice_sessions (user_id);
CREATE INDEX idx_session_started ON practice.practice_sessions (started_at);

-- ─── Session answers ───
CREATE TABLE practice.session_answers (
    id              VARCHAR(36)   PRIMARY KEY,
    session_id      VARCHAR(36)   NOT NULL REFERENCES practice.practice_sessions(id) ON DELETE CASCADE,
    question_id     VARCHAR(128)  NOT NULL,
    question_text   VARCHAR(1024) NOT NULL,
    selected_option VARCHAR(256)  NOT NULL,
    is_correct      BOOLEAN       NOT NULL,
    answered_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answer_session  ON practice.session_answers (session_id);
CREATE INDEX idx_answer_question ON practice.session_answers (question_id);
