# JobPrep QuestionService — Flyway Migrations

Two versioned Flyway migrations for PostgreSQL that create the schema and seed
**70 decks / 700 questions** across 25 subject-area categories.

## Files

```
download/flyway/
├── V1__create_question_schema.sql      (DDL: tables + indexes + CHECK)
├── V2__seed_decks_and_questions.sql    (DML: 70 decks + 700 questions)
├── flyway.conf.example                  (sample Flyway config)
└── README.md
```

## What gets created

### V1 — Schema
- `decks` (id PK, title, category, color_hex, question_count, created_at, updated_at)
- `questions` (id PK, deck_id FK → decks.id ON DELETE CASCADE, title, content,
  difficulty, hint, category, created_at)
- `CHECK` constraint enforcing `difficulty ∈ {EASY, MEDIUM, HARD, NULL}`
- Indexes on `questions(deck_id)`, `questions(difficulty)`, `questions(category)`,
  `decks(category)`

### V2 — Seed data
- 70 decks across 25 categories (Frontend, Backend, Database, Architecture, CS
  Fundamentals, DevOps, Infrastructure, Security, Tools, Mobile, AI/ML, Data,
  Mathematics, Physics, Chemistry, Biology, Astronomy, Earth Science,
  Environment, History, Humanities, Social Science, Business, Design, Medicine,
  Soft Skills)
- 700 questions (10 per deck), IDs `q-0001` through `q-0700`
- Difficulty mix: 210 EASY / 350 MEDIUM / 140 HARD (3/5/2 per deck)
- Idempotent: `INSERT … ON CONFLICT (id) DO NOTHING` makes the migration safe
  to re-apply during dev without producing duplicates

## How to apply

### Option A — Flyway CLI

```bash
# 1. Copy both V1/V2 files into your Flyway migration directory
cp download/flyway/V1__create_question_schema.sql      db/migration/
cp download/flyway/V2__seed_decks_and_questions.sql    db/migration/

# 2. Edit flyway.conf (or use environment variables)
cp download/flyway/flyway.conf.example flyway.conf
# edit flyway.conf: set url, user, password, locations

# 3. Migrate
flyway -configFiles=flyway.conf migrate

# 4. Verify
flyway -configFiles=flyway.conf info
```

### Option B — Spring Boot (auto-applies on startup)

Place the files under `src/main/resources/db/migration/` and ensure
`spring.flyway.enabled=true` (default) in `application.yml`:

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
  datasource:
    url: jdbc:postgresql://localhost:5432/question_db
    username: jobprep
    password: jobprep
```

Spring Boot will detect Flyway on the classpath and apply the migrations on
startup, tracking applied versions in the `flyway_schema_history` table.

### Option C — Manual psql (no Flyway)

```bash
psql -d question_db -f download/flyway/V1__create_question_schema.sql
psql -d question_db -f download/flyway/V2__seed_decks_and_questions.sql
```

## Post-migration sanity checks

Uncomment and run the queries at the bottom of V2, or run them manually:

```sql
SELECT COUNT(*) FROM decks;        -- expect 70
SELECT COUNT(*) FROM questions;    -- expect 700

SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty;
-- EASY    210
-- MEDIUM  350
-- HARD    140

SELECT category, COUNT(*) FROM decks GROUP BY category ORDER BY category;
-- 25 rows
```

## Modifying the seed

The migrations are generated from `scripts/generate_flyway_migration.py` which
reads question data from `scripts/questions_chunk_{1..7}.py`. To change content:

1. Edit the relevant chunk file (or add a new one and bump `NUM_CHUNKS`).
2. Re-run `python3 scripts/generate_flyway_migration.py`.
3. **If V2 has already been applied to any environment**, do NOT edit it in
   place — Flyway checksums will fail. Instead, create a new migration
   `V3__adjust_questions.sql` that performs the necessary UPDATEs/DELETEs/
   INSERTs. Only regenerate V2 if no environment has applied it yet.

## Rollback

Flyway Community Edition does not support automatic rollbacks. To undo:

```sql
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS decks;
DELETE FROM flyway_schema_history WHERE version IN ('1', '2');
```

(Flyway Teams supports `flyway undo` for undo migrations.)
