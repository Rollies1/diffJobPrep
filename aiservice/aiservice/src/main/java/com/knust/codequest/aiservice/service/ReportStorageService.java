package com.knust.codequest.aiservice.service;

import java.io.InputStream;
import java.util.UUID;

/**
 * Abstraction for report artifact storage.
 * <p>
 * Phase 3: Local filesystem implementation.
 * Phase 4+: Swap to S3/MinIO implementation without changing PdfReportService.
 */
public interface ReportStorageService {

    /**
     * Stores the PDF bytes and returns a retrievable path/URL.
     *
     * @param evaluationId the evaluation UUID (used as filename/key)
     * @param pdfBytes     the generated PDF content
     * @return the relative path or URL to retrieve the report
     */
    String store(UUID evaluationId, byte[] pdfBytes);

    /**
     * Retrieves the PDF as a stream.
     *
     * @param path the path/URL returned by store()
     * @return InputStream of the PDF
     */
    InputStream retrieve(String path);

    /**
     * Checks if a report exists at the given path.
     */
    boolean exists(String path);
}
