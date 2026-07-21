package com.knust.codequest.aiservice.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfWriter;
import com.knust.codequest.aiservice.dto.CvRequest;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class CvService {

    public byte[] generateCv(CvRequest request) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        PdfWriter.getInstance(document, outputStream);
        document.open();

        // Fonts
        Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(33, 37, 41));
        Font sectionFont = new Font(Font.HELVETICA, 13, Font.BOLD, new Color(0, 102, 204));
        Font bodyFont = new Font(Font.HELVETICA, 11, Font.NORMAL, new Color(33, 37, 41));
        Font subFont = new Font(Font.HELVETICA, 10, Font.ITALIC, new Color(108, 117, 125));

        // Header
        Paragraph name = new Paragraph(request.getName(), titleFont);
        name.setAlignment(Element.ALIGN_CENTER);
        document.add(name);

        Paragraph contact = new Paragraph(
                request.getEmail() + " | " + request.getPhone(), subFont);
        contact.setAlignment(Element.ALIGN_CENTER);
        document.add(contact);

        Paragraph university = new Paragraph(
                request.getUniversity() + " | " + request.getProgram(), subFont);
        university.setAlignment(Element.ALIGN_CENTER);
        document.add(university);

        document.add(new Paragraph(" "));
        addDivider(document);

        // Skills
        addSection(document, "SKILLS", request.getSkills(), sectionFont, bodyFont);

        // Experience
        addSection(document, "EXPERIENCE", request.getExperience(), sectionFont, bodyFont);

        // Projects
        addSection(document, "PROJECTS", request.getProjects(), sectionFont, bodyFont);

        // Certifications
        addSection(document, "CERTIFICATIONS", request.getCertifications(), sectionFont, bodyFont);

        document.close();
        return outputStream.toByteArray();
    }

    private void addSection(Document document, String title, List<String> items,
                            Font sectionFont, Font bodyFont) throws Exception {
        if (items == null || items.isEmpty()) return;

        Paragraph sectionTitle = new Paragraph(title, sectionFont);
        sectionTitle.setSpacingBefore(10);
        document.add(sectionTitle);

        for (String item : items) {
            Paragraph p = new Paragraph("• " + item, bodyFont);
            p.setIndentationLeft(15);
            document.add(p);
        }

        document.add(new Paragraph(" "));
    }

    private void addDivider(Document document) throws Exception {
        Paragraph divider = new Paragraph("─────────────────────────────────────────────────────");
        divider.setAlignment(Element.ALIGN_CENTER);
        document.add(divider);
        document.add(new Paragraph(" "));
    }
}