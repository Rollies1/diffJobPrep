package com.jobprep.session.config;

import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * ShedLock configuration.
 *
 * Ensures @Scheduled tasks fire on exactly ONE instance even in a
 * multi-replica deployment. Uses a JDBC-backed lock table (created by
 * the Flyway migration).
 *
 * Per review: "In a clustered deployment, @Scheduled alone is not safe —
 * the scheduler fires N times. Use ShedLock."
 *
 * The lock table (shedlock) is created by V1__create_streak_tables.sql.
 */
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT5M")
public class ShedLockConfig {

    @Bean
    public JdbcTemplateLockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
            JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new org.springframework.jdbc.core.JdbcTemplate(dataSource))
                .usingDbTime()
                .build()
        );
    }
}
