-- JobPrep — Seed in-app notification messages (Task 2-backend)
-- Idempotent: ON CONFLICT (id) DO NOTHING means re-running is safe.
-- user_id is NULL for BROADCAST/SYSTEM/DEV (visible to everyone).
-- created_at timestamps spread over the last 2 days.
-- read_at is NULL for the first 2 (so the bell badge shows >0 on first run).

INSERT INTO notification.in_app_notifications
    (id, user_id, audience, type, title, body, emoji, target_screen, created_at, read_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', NULL, 'SYSTEM', 'system',
     'Welcome to JobPrep',
     'Sync the library to get started — your decks and questions will be ready offline.',
     '👋', 'library',
     now() - interval '2 days', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification.in_app_notifications
    (id, user_id, audience, type, title, body, emoji, target_screen, created_at, read_at)
VALUES
    ('a0000000-0000-0000-0000-000000000002', NULL, 'DEV', 'dev',
     'New: Mock Interview Week',
     'Practice a full 7-day interview sprint with AI feedback after every answer.',
     '🎤', 'practice',
     now() - interval '1 day 6 hours', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification.in_app_notifications
    (id, user_id, audience, type, title, body, emoji, target_screen, created_at, read_at)
VALUES
    ('a0000000-0000-0000-0000-000000000003', NULL, 'BROADCAST', 'deck',
     'New deck: React Internals',
     'Reconciliation, fibers, and how React actually updates the DOM.',
     '🧩', 'library',
     now() - interval '1 day',
     now() - interval '12 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification.in_app_notifications
    (id, user_id, audience, type, title, body, emoji, target_screen, created_at, read_at)
VALUES
    ('a0000000-0000-0000-0000-000000000004', NULL, 'SYSTEM', 'streak',
     'Tip: Practice daily to keep your streak',
     'Solve at least one question a day to keep your streak alive.',
     '🔥', 'practice',
     now() - interval '6 hours',
     now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;
