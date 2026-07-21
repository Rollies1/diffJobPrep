-- V1: Initial schema for sessionservice
-- Handles practice sessions and user answers

CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    category_id UUID,
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'TIMEOUT')),
    total_questions INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    evaluation_id UUID,
    overall_score NUMERIC(5,2),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE session_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    question_id UUID NOT NULL,
    sequence_number INTEGER NOT NULL,
    user_answer TEXT NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_answers_session
        FOREIGN KEY (session_id)
        REFERENCES practice_sessions(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON practice_sessions(user_id);
CREATE INDEX idx_sessions_status ON practice_sessions(status);
CREATE INDEX idx_answers_session ON session_answers(session_id);
