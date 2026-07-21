package com.jobprep.practice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "idempotency")
public class IdempotencyProperties {
    private int ttlHours = 24;
    private int maxKeyLength = 128;
}
