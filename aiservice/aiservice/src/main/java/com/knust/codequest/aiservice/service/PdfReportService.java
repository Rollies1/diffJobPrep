package com.knust.codequest.aiservice.service;

import com.knust.codequest.aiservice.dto.AiEvaluationResult;
import com.knust.codequest.aiservice.dto.QuestionEvaluation;
import com.knust.codequest.aiservice.model.AiEvaluationEntity;
import com.knust.codequest.aiservice.repository.AiEvaluationRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * PDF report generation service using OpenPDF.
 * <p>
 * Generates a formatted interview evaluation report with:
 * <ul>
 *   <li>Header with branding and generation date</li>
 *   <li>Overall score (prominent)</li>
 *   <li>Per-question breakdown with scores, feedback, missing points, strengths</li>
 *   <li>Executive summary</li>
 * </ul>
 * Async execution prevents blocking the evaluation response thread.
 */
@Service
public class PdfReportService {

    private static final Logger log = LoggerFactory.getLogger(PdfReportService.class);
    private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' HH:mm").withZone(ZoneId.systemDefault());

    private final ReportStorageService storageService;
    private final AiEvaluationRepository evaluationRepository;

    public PdfReportService(ReportStorageService storageService,
                            AiEvaluationRepository evaluationRepository) {
        this.storageService = storageService;
        this.evaluationRepository = evaluationRepository;
    }

    /**
     * Async PDF generation triggered after evaluation completion.
     *
     * @param evaluationId the evaluation UUID
     * @param result       the structured AI evaluation result
     */
    @Async("taskExecutor")
    public void generateReport(UUID evaluationId, AiEvaluationResult result) {
        log.info("Starting PDF generation for evaluationId={}", evaluationId);

        try {
            byte[] pdfBytes = buildPdf(evaluationId, result);
            String path = storageService.store(evaluationId, pdfBytes);

            // Update entity with report URL
            evaluationRepository.findById(evaluationId).ifPresent(entity -> {
                entity.setGeneratedPdfUrl(path);
                evaluationRepository.save(entity);
                log.info("PDF report stored for evaluationId={} at path={}", evaluationId, path);
            });

        } catch (Exception e) {
            log.error("PDF generation failed for evaluationId={}", evaluationId, e);
            // Non-fatal: evaluation is still valid, just no PDF
        }
    }

    private byte[] buildPdf(UUID evaluationId, AiEvaluationResult result) throws DocumentException {
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        // Fonts
        Font titleFont = new Font(Font.HELVETICA, 24, Font.BOLD, new Color(0, 51, 102));
        Font subtitleFont = new Font(Font.HELVETICA, 12, Font.ITALIC, Color.GRAY);
        Font sectionFont = new Font(Font.HELVETICA, 14, Font.BOLD, new Color(0, 51, 102));
        Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
        Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);
        Font scoreFont = new Font(Font.HELVETICA, 36, Font.BOLD, new Color(0, 128, 0));

        // Header
        Paragraph title = new Paragraph("Interview Evaluation Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph generated = new Paragraph("Generated: " + DATE_FORMATTER.format(Instant.now()), subtitleFont);
        generated.setAlignment(Element.ALIGN_CENTER);
        document.add(generated);

        Paragraph evalId = new Paragraph("Evaluation ID: " + evaluationId, subtitleFont);
        evalId.setAlignment(Element.ALIGN_CENTER);
        document.add(evalId);

        document.add(Chunk.NEWLINE);

        // Overall Score Box
        PdfPTable scoreTable = new PdfPTable(1);
        scoreTable.setWidthPercentage(40);
        scoreTable.setHorizontalAlignment(Element.ALIGN_CENTER);
        PdfPCell scoreCell = new PdfPCell();
        scoreCell.setBackgroundColor(new Color(240, 248, 255));
        scoreCell.setPadding(15);
        scoreCell.setBorderColor(new Color(0, 51, 102));
        scoreCell.setBorderWidth(2);
        scoreCell.addElement(new Paragraph("Overall Score", labelFont));
        Paragraph scoreValue = new Paragraph(String.valueOf(result.overallScore()), scoreFont);
        scoreValue.setAlignment(Element.ALIGN_CENTER);
        scoreCell.addElement(scoreValue);
        scoreCell.addElement(new Paragraph("/ 100", subtitleFont));
        scoreTable.addCell(scoreCell);
        document.add(scoreTable);

        document.add(Chunk.NEWLINE);

        // Per-Question Breakdown
        Paragraph section = new Paragraph("Per-Question Breakdown", sectionFont);
        document.add(section);
        document.add(Chunk.NEWLINE);

        if (result.questionEvaluations() != null) {
            for (int i = 0; i < result.questionEvaluations().size(); i++) {
                QuestionEvaluation qe = result.questionEvaluations().get(i);

                // Question header
                Paragraph qHeader = new Paragraph();
                qHeader.add(new Chunk("Question " + (i + 1) + ": ", labelFont));
                qHeader.add(new Chunk(String.valueOf(qe.questionId()), normalFont));
                document.add(qHeader);

                // Score
                Paragraph qScore = new Paragraph();
                qScore.add(new Chunk("Score: ", labelFont));
                qScore.add(new Chunk(qe.score() + "/100", normalFont));
                document.add(qScore);

                // Feedback
                Paragraph qFeedback = new Paragraph();
                qFeedback.add(new Chunk("Feedback: ", labelFont));
                qFeedback.add(new Chunk(qe.feedback(), normalFont));
                document.add(qFeedback);

                // Missing points
                if (qe.missingPoints() != null && !qe.missingPoints().isEmpty()) {
                    Paragraph missing = new Paragraph();
                    missing.add(new Chunk("Missing Points: ", labelFont));
                    missing.add(new Chunk(String.join(", ", qe.missingPoints()), normalFont));
                    document.add(missing);
                }

                // Strengths
                if (qe.strengths() != null && !qe.strengths().isEmpty()) {
                    Paragraph strengths = new Paragraph();
                    strengths.add(new Chunk("Strengths: ", labelFont));
                    strengths.add(new Chunk(String.join(", ", qe.strengths()), normalFont));
                    document.add(strengths);
                }

                document.add(Chunk.NEWLINE);
            }
        }

        // Summary
        Paragraph summarySection = new Paragraph("Executive Summary", sectionFont);
        document.add(summarySection);
        document.add(Chunk.NEWLINE);
        document.add(new Paragraph(result.overallFeedback(), normalFont));

        // Footer
        document.add(Chunk.NEWLINE);
        Paragraph footer = new Paragraph("--- End of Report ---", subtitleFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }
}
