-- Insert test data here
INSERT INTO categories (id, name) VALUES (1, 'Technical'), (2, 'Behavioral');
INSERT INTO topics (topic_id, name, category_id) VALUES (1, 'Algorithms', 1), (2, 'Leadership', 2);
INSERT INTO roles (role_id, name, level) VALUES (1, 'Software Engineer', 'New Grad');
INSERT INTO users (user_id, email, target_role_id) VALUES ('11111111-1111-1111-1111-111111111111', 'test@example.com', 1);

-- Test questions
INSERT INTO questions (question_id, content, difficulty, is_active, language) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test behavioral question?', 1, true, 'en');
INSERT INTO questions (question_id, content, difficulty, is_active, language) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test coding question?', 2, true, 'en');
INSERT INTO questions (question_id, content, difficulty, is_active, language) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test system design question?', 3, true, 'en');

-- Map questions to role and topic
INSERT INTO question_roles (question_id, role_id) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1);
INSERT INTO question_topics (question_id, topic_id) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1);
INSERT INTO question_topics (question_id, topic_id) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2);

-- Test sessions
-- Completed session for user progress and recent sessions
INSERT INTO sessions (session_id, user_id, question_id, started_at, completed_at, score, status, time_spent_sec) 
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '1 hour', NOW(), 85, 'completed', 150);

-- In-progress session for completing test
INSERT INTO sessions (session_id, user_id, question_id, started_at, status) 
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), 'in_progress');
