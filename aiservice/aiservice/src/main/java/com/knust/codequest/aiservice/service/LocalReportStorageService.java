package com.knust.codequest.aiservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Local filesystem storage for PDF reports.
 * <p>
 * Default when no {@code s3} profile is active.
 * Stores files to {@code ai.reports.storage-path} (default: ./reports).
 */
@Service
@Profile("!s3")
public class LocalReportStorageService implements ReportStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalReportStorageService.class);
    private static final String FILE_EXTENSION = ".pdf";

    private final Path storagePath;

    public LocalReportStorageService(@Value("${ai.reports.storage-path:./reports}") String storagePath) {
        this.storagePath = Paths.get(storagePath);
        try {
            Files.createDirectories(this.storagePath);
            log.info("Report storage initialized at: {}", this.storagePath.toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Failed to create report storage directory: " + storagePath, e);
        }
    }

    @Override
    public String store(UUID evaluationId, byte[] pdfBytes) {
        String filename = evaluationId + FILE_EXTENSION;
        Path filePath = storagePath.resolve(filename);

        try {
            Files.write(filePath, pdfBytes);
            log.info("Stored report for evaluationId={} at {}", evaluationId, filePath);
            return filename;
        } catch (IOException e) {
            log.error("Failed to store report for evaluationId={}", evaluationId, e);
            throw new RuntimeException("Failed to store PDF report", e);
        }
    }

    @Override
    public InputStream retrieve(String path) {
        Path filePath = storagePath.resolve(path);
        try {
            return Files.newInputStream(filePath);
        } catch (IOException e) {
            log.error("Failed to retrieve report at path: {}", path, e);
            throw new RuntimeException("Report not found: " + path, e);
        }
    }

    @Override
    public boolean exists(String path) {
        return Files.exists(storagePath.resolve(path));
    }
}
