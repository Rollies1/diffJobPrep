package com.jobprep.notification.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "expo")
public class ExpoProperties {
    private String pushUrl = "https://exp.host/--/api/v2/push/send";
    private String receiptUrl = "https://exp.host/--/api/v2/push/getReceipts";
    /** Set EXPO_ACCESS_TOKEN for production. Empty = anonymous (dev only). */
    private String accessToken = "";
    /** Expo caps at 100 recipients per request. */
    private int batchSize = 100;
}
