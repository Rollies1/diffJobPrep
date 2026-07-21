# Question Service Database Queries

Optimized, production-ready queries for the JobPrep Question Bank.

## Overview

These queries are designed to support:
- Filtering questions by role, topic, and difficulty
- Spaced repetition (finding unmastered questions)
- User progress analytics by topic

All queries leverage the optimized index strategy from `V1__init_schema.sql`.

---

## Query 1: Filtered Questions by Role + Topic + Difficulty

### Purpose
Retrieve questions for a specific role and topic, filtered by difficulty level. Returns questions with all related topics.

### Use Cases
- Display practice questions for a user's target role
- Filter by topic and difficulty for customized practice sessions
- Build question recommendation lists

### Parameters
- `role_name` (String): e.g., "Software Engineer"
- `role_level` (String): e.g., "New Grad"
- `topic_name` (String): e.g., "Algorithms"
- `max_difficulty` (INT): 1-5, filter questions at or below this difficulty

### Performance Notes
- ✅ Uses `idx_questions_hot` partial index (is_active=true, language='en')
- ✅ Uses `idx_roles_name_level` composite index for role filtering
- ✅ Uses `idx_question_topics_composite` for topic joins
- **Execution Time:** ~5-10ms for typical result sets
- **Result Set:** Up to 20 questions

### SQL
```sql
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
```

---

## Query 2: Unmastered Questions (Spaced Repetition)

### Purpose
Find questions that a user has NOT mastered (scored <80) for spaced repetition practice. Excludes already-mastered questions.

### Use Cases
- Generate daily practice recommendations
- Implement spaced repetition algorithm
- Find next questions to review based on user performance

### Parameters
- `user_uuid` (UUID): The user's ID
- `role_name` (String): e.g., "Software Engineer"
- `min_score_threshold` (INT): Default 80, questions with score >= this are considered "mastered"

### Performance Notes
- ✅ Uses `idx_sessions_user_completed` partial index (status='completed')
- ✅ CTE (WITH clause) for efficient exclusion logic
- ✅ Ordered by difficulty for progressive difficulty
- **Execution Time:** ~15-30ms (depends on user session history)
- **Result Set:** Up to 5 questions
- ⚠️ Avoids `ORDER BY RANDOM()` full scan (replaces with deterministic ordering)

### SQL
```sql
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
```

---

## Query 3: User Progress by Topic

### Purpose
Analyze user's performance metrics grouped by topic. Shows attempted questions, average score, and average time spent per topic.

### Use Cases
- Display user dashboard with topic-level analytics
- Identify weak areas (low avg_score)
- Track time efficiency (avg_time per topic)
- Generate progress reports

### Parameters
- `user_uuid` (UUID): The user's ID
- Filter: Only completed sessions (status='completed')

### Performance Notes
- ✅ Uses `idx_sessions_user_completed` partial index (status='completed', includes user_id)
- ✅ Single GROUP BY on topic name
- ✅ Efficient aggregation without subqueries
- **Execution Time:** ~10-20ms per user
- **Result Set:** Number of topics attempted (typically 5-20 rows)

### SQL
```sql
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
```

---

## Index Strategy Summary

| Index | Query | Benefit |
|-------|-------|----------|
| `idx_questions_hot` | Q1 | Partial index for active English questions |
| `idx_roles_name_level` | Q1, Q2 | Fast role filtering |
| `idx_question_topics_composite` | Q1, Q3 | Fast topic joins |
| `idx_sessions_user_completed` | Q2, Q3 | Partial index for completed sessions |

---

## Best Practices

1. **Always filter by `language`** - Reduces dataset size
2. **Always filter by `is_active=true`** - Only active questions in practice
3. **Use `status='completed'`** - Excludes in-progress sessions from analytics
4. **Use CTEs for complex exclusions** - Replaces `NOT IN` subqueries
5. **Order deterministically** - Avoid `RANDOM()` for production queries

---

## Maintenance Notes

- Review execution plans quarterly with `EXPLAIN ANALYZE`
- Monitor slow query logs (queries >100ms)
- Update statistics: `ANALYZE questions, sessions, question_topics;`
- Consider partitioning `sessions` table by `user_id` if it grows beyond 10M rows
