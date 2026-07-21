package com.knust.codequest.aiservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.InputStream;
import java.util.UUID;

/**
 * S3-compatible object storage for PDF reports.
 * <p>
 * Works with AWS S3, MinIO, DigitalOcean Spaces, Wasabi, etc.
 * Activate with profile {@code s3}. Overrides local filesystem storage.
 */
@Service
@Profile("s3")
public class S3ReportStorageService implements ReportStorageService {

    private static final Logger log = LoggerFactory.getLogger(S3ReportStorageService.class);
    private static final String FILE_EXTENSION = ".pdf";

    private final S3Client s3Client;
    private final String bucketName;
    private final String publicUrlPrefix;

    public S3ReportStorageService(
            S3Client s3Client,
            @Value("${ai.reports.s3.bucket:codequest-reports}") String bucketName,
            @Value("${ai.reports.s3.public-url-prefix:}") String publicUrlPrefix) {

        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.publicUrlPrefix = publicUrlPrefix;

        ensureBucketExists();
        log.info("S3 report storage initialized: bucket={}", bucketName);
    }

    @Override
    public String store(UUID evaluationId, byte[] pdfBytes) {
        String key = evaluationId + FILE_EXTENSION;

        PutObjectRequest putRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .contentType("application/pdf")
            .contentDisposition("attachment; filename=\"interview-report-" + evaluationId + ".pdf\"")
            .build();

        s3Client.putObject(putRequest, RequestBody.fromBytes(pdfBytes));
        log.info("Stored report for evaluationId={} in s3://{}/{}", evaluationId, bucketName, key);

        // Return public URL if configured, otherwise return the S3 key
        if (publicUrlPrefix != null && !publicUrlPrefix.isBlank()) {
            return publicUrlPrefix + "/" + key;
        }
        return key;
    }

    @Override
    public InputStream retrieve(String path) {
        String key = extractKey(path);

        GetObjectRequest getRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();

        return s3Client.getObject(getRequest);
    }

    @Override
    public boolean exists(String path) {
        String key = extractKey(path);

        try {
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
            s3Client.headObject(headRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    private void ensureBucketExists() {
        try {
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                .bucket(bucketName)
                .build();
            s3Client.headBucket(headBucketRequest);
            log.debug("Bucket {} already exists", bucketName);
        } catch (NoSuchBucketException e) {
            log.info("Creating bucket: {}", bucketName);
            s3Client.createBucket(CreateBucketRequest.builder()
                .bucket(bucketName)
                .build());
        }
    }

    private String extractKey(String path) {
        // If path is a full URL, extract just the key
        if (publicUrlPrefix != null && !publicUrlPrefix.isBlank() && path.startsWith(publicUrlPrefix)) {
            return path.substring(publicUrlPrefix.length() + 1); // +1 for the slash
        }
        return path;
    }
}
