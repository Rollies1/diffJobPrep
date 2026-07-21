package com.knust.codequest.aiservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * S3/MinIO client configuration.
 * <p>
 * For MinIO, set endpoint to your MinIO URL (e.g., http://localhost:9000).
 * For AWS S3, leave endpoint empty and set region.
 * <p>
 * Activate with profile {@code s3}.
 */
@Configuration
@Profile("s3")
public class S3Config {

    @Value("${ai.reports.s3.access-key:${AWS_ACCESS_KEY_ID:}}")
    private String accessKey;

    @Value("${ai.reports.s3.secret-key:${AWS_SECRET_ACCESS_KEY:}}")
    private String secretKey;

    @Value("${ai.reports.s3.region:us-east-1}")
    private String region;

    @Value("${ai.reports.s3.endpoint:}")
    private String endpoint; // For MinIO: http://localhost:9000

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        S3Client.Builder builder = S3Client.builder()
            .credentialsProvider(StaticCredentialsProvider.create(credentials))
            .region(Region.of(region));

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint))
                .serviceConfiguration(S3Configuration.builder()
                    .pathStyleAccessEnabled(true) // Required for MinIO
                    .build());
        }

        return builder.build();
    }
}
