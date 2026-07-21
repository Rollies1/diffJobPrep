-- ============================================================================
-- Question Service Database Queries
-- ============================================================================
-- Optimized, production-ready queries for the JobPrep Question Bank
-- See queries.md for detailed documentation
-- ============================================================================

-- ============================================================================
-- Query 1: Filtered questions for a role + topic + difficulty
-- ============================================================================
-- Purpose: Retrieve questions for a specific role and topic, filtered by difficulty
-- Parameters: role_name, role_level, topic_name, max_difficulty
-- Performance: ~5-10ms (uses idx_questions_hot, idx_roles_name_level)
-- ============================================================================

SELECT 
    q.question_id,
    q.content,
    q.model_answer,
    q.difficulty,
    q.time_seconds,
    q.source,
    q.company_tag,
    q.language,
    array_agg(t.name) as topics
FROM questions q
JOIN question_topics qt ON q.question_id = qt.question_id
JOIN topics t ON qt.topic_id = t.topic_id
JOIN question_roles qr ON q.question_id = qr.question_id
JOIN roles r ON qr.role_id = r.role_id
WHERE r.name = 'Software Engineer'
  AND r.level = 'New Grad'
  AND t.name = 'Algorithms'
  AND q.difficulty <= 3
  AND q.is_active = true
  AND q.language = 'en'
GROUP BY 
    q.question_id,
    q.content,
    q.model_answer,
    q.difficulty,
    q.time_seconds,
    q.source,
    q.company_tag,
    q.language
ORDER BY q.difficulty
LIMIT 20;


-- ============================================================================
-- Query 2: Unmastered questions (spaced repetition)
-- ============================================================================
-- Purpose: Find questions user has NOT mastered (score <80) for practice
-- Parameters: user_uuid, role_name, min_score_threshold (default 80)
-- Performance: ~15-30ms (uses idx_sessions_user_completed, CTE for efficiency)
-- Notes: Uses LEFT JOIN anti-join instead of NOT IN for scalability
-- ============================================================================

WITH mastered AS (
    SELECT DISTINCT question_id
    FROM sessions
    WHERE user_id = 'user-uuid'
      AND status = 'completed'
      AND score >= 80
)
SELECT q.*
FROM questions q
JOIN question_roles qr ON q.question_id = qr.question_id
JOIN roles r ON qr.role_id = r.role_id
LEFT JOIN mastered m ON q.question_id = m.question_id
WHERE r.name = 'Software Engineer'
  AND q.is_active = true
  AND q.language = 'en'
  AND m.question_id IS NULL
ORDER BY q.difficulty, q.question_id
LIMIT 5;


-- ============================================================================
-- Query 3: User progress by topic (analytics)
-- ============================================================================
-- Purpose: Analyze user performance metrics grouped by topic
-- Parameters: user_uuid
-- Performance: ~10-20ms (uses idx_sessions_user_completed)
-- Returns: attempted count, avg_score, avg_time per topic
-- ============================================================================

SELECT 
    t.name as topic,
    COUNT(DISTINCT s.question_id) as attempted,
    AVG(s.score) as avg_score,
    AVG(s.time_spent_sec) as avg_time
FROM sessions s
JOIN questions q ON s.question_id = q.question_id
JOIN question_topics qt ON q.question_id = qt.question_id
JOIN topics t ON qt.topic_id = t.topic_id
WHERE s.user_id = 'user-uuid'
  AND s.status = 'completed'
GROUP BY t.name;
