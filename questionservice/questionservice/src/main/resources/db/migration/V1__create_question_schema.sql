-- =============================================================
-- Flyway migration V1: Create QuestionService schema
-- =============================================================
-- Target: PostgreSQL 12+
-- Tables: decks, questions
-- Notes:
--   * Uses CREATE TABLE IF NOT EXISTS so the migration is safe to
--     re-apply during dev (Flyway 'repair' or manual re-run).
--   * Adds supporting indexes for common query patterns.
--   * question_count is denormalized for fast deck-list rendering;
--     keep it in sync via application logic or triggers.
-- =============================================================

CREATE TABLE IF NOT EXISTS decks (
    id              VARCHAR(64)   PRIMARY KEY,
    title           VARCHAR(255)  NOT NULL,
    category        VARCHAR(64)   NOT NULL,
    color_hex       VARCHAR(7),
    question_count  INTEGER       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
    id          VARCHAR(64)   PRIMARY KEY,
    deck_id     VARCHAR(64)   NOT NULL,
    title       VARCHAR(255)  NOT NULL,
    content     TEXT          NOT NULL,
    difficulty  VARCHAR(16),
    hint        TEXT,
    category    VARCHAR(64),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_questions_deck
        FOREIGN KEY (deck_id) REFERENCES decks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT ck_questions_difficulty
        CHECK (difficulty IS NULL OR difficulty IN ('EASY', 'MEDIUM', 'HARD'))
);

-- Indexes for typical read paths
CREATE INDEX IF NOT EXISTS idx_questions_deck_id    ON questions (deck_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_category   ON questions (category);
CREATE INDEX IF NOT EXISTS idx_decks_category       ON decks (category);
