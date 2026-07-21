package com.jobprep.session.controller;

import com.jobprep.session.scheduler.StreakReminderScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Cron-triggered endpoints.
 *
 * In Spring, @Scheduled runs inside the JVM. But in serverless/managed
 * deployments (Vercel, Cloud Run, ECS with 0→N scaling), you can't rely
 * on an always-running JVM. This endpoint lets an external cron
 * (Vercel Cron, GitHub Actions, system crontab) trigger the sweep.
 *
 * Protected by X-Cron-Secret header — end users cannot trigger it.
 */
@RestController
@RequestMapping("/api/cron")
@RequiredArgsConstructor
public class CronController {

    private final StreakReminderScheduler scheduler;

    @Value("${cron.secret}")
    private String cronSecret;

    @PostMapping("/streak-reminders")
    public ResponseEntity<?> streakReminders(@RequestHeader("X-Cron-Secret") String secret) {
        if (cronSecret == null || !cronSecret.equals(secret)) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
        scheduler.runStreakReminders();
        return ResponseEntity.ok(Map.of("ok", true, "triggered", "streak_reminders"));
    }
}
