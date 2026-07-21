CREATE TABLE user_topic_readiness (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id),
    topic_id INT NOT NULL REFERENCES topics(topic_id),
    is_ready BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_user_topic_readiness_user ON user_topic_readiness(user_id);
