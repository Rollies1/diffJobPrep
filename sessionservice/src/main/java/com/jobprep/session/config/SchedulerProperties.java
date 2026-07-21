package com.jobprep.session.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Data
@ConfigurationProperties(prefix = "scheduler")
public class SchedulerProperties {

    private Streak streak = new Streak();

    @Data
    public static class Streak {
        private int hourStart = 18;
        private int hourEnd = 21;
        private String cron = "0 0 * * * *";
        private Duration lockAtMostFor = Duration.ofMinutes(5);
        private Duration lockAtLeastFor = Duration.ofMinutes(1);
    }
}
