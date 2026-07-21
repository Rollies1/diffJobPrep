package com.knust.codequest.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * JobPrep Notification Service.
 *
 * Responsibilities:
 *   - Device token registration (upsert on userId + deviceId)
 *   - Expo push delivery (batched, chunked, auto-pruning dead tokens)
 *   - Notification audit log
 *
 * Does NOT own streak logic — sessionservice owns that and calls this
 * service's internal API to send reminders.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
