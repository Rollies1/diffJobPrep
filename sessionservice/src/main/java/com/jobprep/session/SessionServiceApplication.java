package com.jobprep.session;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * JobPrep Session Service.
 *
 * Owns:
 *   - User streak tracking (read from practice sessions)
 *   - The streak-reminder scheduler (fires hourly, checks each device's
 *     local timezone, calls notificationservice to send pushes)
 *
 * Does NOT own push delivery — that's notificationservice.
 *
 * Uses ShedLock so the scheduler fires exactly once even with N replicas.
 */
@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class SessionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SessionServiceApplication.class, args);
    }
}
