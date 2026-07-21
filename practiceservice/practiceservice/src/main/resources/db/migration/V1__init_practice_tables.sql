CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    topic_id INT,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL,
    answer_text TEXT,
    ai_feedback TEXT,
    score INT CHECK (score BETWEEN 0 AND 100),
    answer_duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

CREATE INDEX idx_sessions_user ON interview_sessions(user_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_answers_session ON user_answers(session_id);
