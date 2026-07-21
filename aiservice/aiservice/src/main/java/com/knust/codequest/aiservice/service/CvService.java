package com.knust.codequest.aiservice.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.knust.codequest.aiservice.dto.CvRequest;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class CvService {

    public byte[] generateCv(CvRequest request) throws Exception {
        String template = request.getTemplate() != null ? request.getTemplate() : "Modern";
        switch (template.toLowerCase()) {
            case "classic": return generateClassicPdf(request);
            case "minimalist": return generateMinimalistPdf(request);
            default: return generateModernPdf(request);
        }
    }

    // ─── MODERN TEMPLATE ───────────────────────────────────────────
    private byte[] generateModernPdf(CvRequest request) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 50, 50, 50, 50);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Color blue = new Color(0, 102, 204);
        Color darkGray = new Color(33, 37, 41);
        Color lightGray = new Color(108, 117, 125);

        Font nameFont = new Font(Font.HELVETICA, 24, Font.BOLD, blue);
        Font sectionFont = new Font(Font.HELVETICA, 12, Font.BOLD, Color.WHITE);
        Font bodyFont = new Font(Font.HELVETICA, 10, Font.NORMAL, darkGray);
        Font subFont = new Font(Font.HELVETICA, 10, Font.ITALIC, lightGray);

        // Header
        Paragraph name = new Paragraph(request.getName(), nameFont);
        name.setAlignment(Element.ALIGN_CENTER);
        doc.add(name);

        Paragraph contact = new Paragraph(request.getEmail() + " | " + request.getPhone(), subFont);
        contact.setAlignment(Element.ALIGN_CENTER);
        doc.add(contact);

        Paragraph uni = new Paragraph(request.getUniversity() + " | " + request.getProgram(), subFont);
        uni.setAlignment(Element.ALIGN_CENTER);
        doc.add(uni);

        doc.add(new Paragraph(" "));

        // Professional Summary
        if (request.getIntroduction() != null && !request.getIntroduction().isEmpty()) {
            addModernSection(doc, "PROFESSIONAL SUMMARY", sectionFont, bodyFont, blue);
            doc.add(new Paragraph(request.getIntroduction(), bodyFont));
            doc.add(new Paragraph(" "));
        }

        // Sections
        addModernSectionList(doc, "SKILLS", request.getSkills(), sectionFont, bodyFont, blue);
        addModernSectionList(doc, "EXPERIENCE", request.getExperience(), sectionFont, bodyFont, blue);
        addModernSectionList(doc, "PROJECTS", request.getProjects(), sectionFont, bodyFont, blue);
        addModernSectionList(doc, "CERTIFICATIONS", request.getCertifications(), sectionFont, bodyFont, blue);

        doc.close();
        return out.toByteArray();
    }

    private void addModernSection(Document doc, String title, Font sectionFont, Font bodyFont, Color blue) throws Exception {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(title, sectionFont));
        cell.setBackgroundColor(blue);
        cell.setPadding(5);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
        doc.add(table);
        doc.add(new Paragraph(" "));
    }

    private void addModernSectionList(Document doc, String title, List<String> items, Font sectionFont, Font bodyFont, Color blue) throws Exception {
        if (items == null || items.isEmpty()) return;
        addModernSection(doc, title, sectionFont, bodyFont, blue);
        for (String item : items) {
            Paragraph p = new Paragraph("▸ " + item, bodyFont);
            p.setIndentationLeft(15);
            doc.add(p);
        }
        doc.add(new Paragraph(" "));
    }

    // ─── CLASSIC TEMPLATE ──────────────────────────────────────────
    private byte[] generateClassicPdf(CvRequest request) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 60, 60, 60, 60);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Color darkBrown = new Color(101, 67, 33);
        Color black = new Color(0, 0, 0);
        Color gray = new Color(80, 80, 80);

        Font nameFont = new Font(Font.TIMES_ROMAN, 26, Font.BOLD, black);
        Font sectionFont = new Font(Font.TIMES_ROMAN, 13, Font.BOLD, darkBrown);
        Font bodyFont = new Font(Font.TIMES_ROMAN, 11, Font.NORMAL, black);
        Font subFont = new Font(Font.TIMES_ROMAN, 10, Font.ITALIC, gray);

        // Header
        Paragraph name = new Paragraph(request.getName(), nameFont);
        name.setAlignment(Element.ALIGN_CENTER);
        doc.add(name);

        Paragraph contact = new Paragraph(request.getEmail() + "  |  " + request.getPhone(), subFont);
        contact.setAlignment(Element.ALIGN_CENTER);
        doc.add(contact);

        Paragraph uni = new Paragraph(request.getUniversity() + "  |  " + request.getProgram(), subFont);
        uni.setAlignment(Element.ALIGN_CENTER);
        doc.add(uni);

        doc.add(new Paragraph("_____________________________________________", new Font(Font.TIMES_ROMAN, 12, Font.NORMAL, darkBrown)));
        doc.add(new Paragraph(" "));

        // Professional Summary
        if (request.getIntroduction() != null && !request.getIntroduction().isEmpty()) {
            doc.add(new Paragraph("Professional Summary", sectionFont));
            doc.add(new Paragraph(request.getIntroduction(), bodyFont));
            doc.add(new Paragraph(" "));
        }

        addClassicSection(doc, "Skills", request.getSkills(), sectionFont, bodyFont);
        addClassicSection(doc, "Experience", request.getExperience(), sectionFont, bodyFont);
        addClassicSection(doc, "Projects", request.getProjects(), sectionFont, bodyFont);
        addClassicSection(doc, "Certifications", request.getCertifications(), sectionFont, bodyFont);

        doc.close();
        return out.toByteArray();
    }

    private void addClassicSection(Document doc, String title, List<String> items, Font sectionFont, Font bodyFont) throws Exception {
        if (items == null || items.isEmpty()) return;
        doc.add(new Paragraph(title, sectionFont));
        for (String item : items) {
            Paragraph p = new Paragraph("• " + item, bodyFont);
            p.setIndentationLeft(20);
            doc.add(p);
        }
        doc.add(new Paragraph(" "));
    }

    // ─── MINIMALIST TEMPLATE ───────────────────────────────────────
    private byte[] generateMinimalistPdf(CvRequest request) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 70, 70, 70, 70);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Color accent = new Color(50, 50, 50);
        Color light = new Color(150, 150, 150);

        Font nameFont = new Font(Font.HELVETICA, 22, Font.BOLD, accent);
        Font sectionFont = new Font(Font.HELVETICA, 10, Font.BOLD, accent);
        Font bodyFont = new Font(Font.HELVETICA, 10, Font.NORMAL, accent);
        Font subFont = new Font(Font.HELVETICA, 9, Font.NORMAL, light);

        // Header
        Paragraph name = new Paragraph(request.getName(), nameFont);
        name.setAlignment(Element.ALIGN_LEFT);
        doc.add(name);

        Paragraph contact = new Paragraph(request.getEmail() + "   " + request.getPhone(), subFont);
        doc.add(contact);

        Paragraph uni = new Paragraph(request.getUniversity() + "   " + request.getProgram(), subFont);
        doc.add(uni);

        doc.add(new Paragraph(" "));
        doc.add(new Paragraph(" "));

        // Professional Summary
        if (request.getIntroduction() != null && !request.getIntroduction().isEmpty()) {
            doc.add(new Paragraph("SUMMARY", sectionFont));
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(request.getIntroduction(), bodyFont));
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(" "));
        }

        addMinimalistSection(doc, "SKILLS", request.getSkills(), sectionFont, bodyFont);
        addMinimalistSection(doc, "EXPERIENCE", request.getExperience(), sectionFont, bodyFont);
        addMinimalistSection(doc, "PROJECTS", request.getProjects(), sectionFont, bodyFont);
        addMinimalistSection(doc, "CERTIFICATIONS", request.getCertifications(), sectionFont, bodyFont);

        doc.close();
        return out.toByteArray();
    }

    private void addMinimalistSection(Document doc, String title, List<String> items, Font sectionFont, Font bodyFont) throws Exception {
        if (items == null || items.isEmpty()) return;
        doc.add(new Paragraph(title, sectionFont));
        doc.add(new Paragraph(" "));
        for (String item : items) {
            Paragraph p = new Paragraph(item, bodyFont);
            p.setIndentationLeft(10);
            doc.add(p);
        }
        doc.add(new Paragraph(" "));
        doc.add(new Paragraph(" "));
    }
}