package com.knust.codequest.aiservice.controller;

import com.knust.codequest.aiservice.dto.CvRequest;
import com.knust.codequest.aiservice.service.CvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiController {

    private final CvService cvService;

    @PostMapping("/cv/generate")
    public ResponseEntity<byte[]> generateCv(@RequestBody CvRequest request) {
        try {
            byte[] pdf = cvService.generateCv(request);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + request.getName().replace(" ", "_") + "_CV.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}