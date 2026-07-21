package com.jobprep.practice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * JobPrep Practice Service.
 *
 * Owns:
 *   - Practice sessions and answers
 *   - Idempotency layer (separate IdempotencyKey table, race-safe via
 *     PostgreSQL ON CONFLICT)
 *
 * Race safety:
 *   The (user_id, key) UNIQUE constraint in PostgreSQL guarantees that
 *   exactly one INSERT wins under concurrent submission. We use
 *   INSERT ... ON CONFLICT DO NOTHING RETURNING * — a single round-trip,
 *   no TOCTOU window, no exception-catching.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class PracticeServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PracticeServiceApplication.class, args);
    }
}
