-- V1: Initial schema for questionservice
-- Designed for production: UUIDs, indexes, foreign keys, audit fields, soft deletes

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_categories_name UNIQUE (name)
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL,
    question TEXT NOT NULL,
    sample_answer TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    expected_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_questions_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_question_not_empty CHECK (LENGTH(TRIM(question)) > 0)
);

CREATE INDEX idx_questions_category ON questions(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_difficulty ON questions(difficulty) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_category_difficulty ON questions(category_id, difficulty) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_keywords ON questions USING GIN(expected_keywords) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
