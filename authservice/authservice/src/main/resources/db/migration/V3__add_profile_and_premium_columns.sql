-- V3: Add username, bio, premium, avatar, onboarding columns to users.
-- username defaults to NULL first (set by AuthService on registration),
-- then backfilled + constrained UNIQUE by a second pass.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(40);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expiry TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Backfill username from the first token of `name` for existing rows so the
-- UNIQUE constraint can be added safely.
UPDATE users SET username = split_part(name, ' ', 1) WHERE username IS NULL;

-- Add the UNIQUE constraint now that every row has a value.
ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
