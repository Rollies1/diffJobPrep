CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE ai_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    request_payload JSONB,
    raw_llm_response JSONB,
    structured_result JSONB,
    tokens_input INTEGER,
    tokens_output INTEGER,
    estimated_cost_usd DECIMAL(10, 4),
    overall_score DECIMAL(5, 2),
    error_message VARCHAR(2000),
    generated_pdf_url VARCHAR(255),
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    prompt_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
