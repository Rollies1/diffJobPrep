package com.knust.codequest.aiservice.controller;

import com.knust.codequest.aiservice.dto.CvRequest;
import com.knust.codequest.aiservice.dto.EvaluationRequest;
import com.knust.codequest.aiservice.dto.EvaluationResponse;
import com.knust.codequest.aiservice.service.AiService;
import com.knust.codequest.aiservice.service.CvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;
    private final CvService cvService;

    @PostMapping("/evaluate")
    public ResponseEntity<EvaluationResponse> evaluate(@RequestBody EvaluationRequest request) {
        return ResponseEntity.ok(aiService.evaluate(request));
    }

    @PostMapping("/cv/polish-intro")
    public ResponseEntity<Map<String, String>> polishIntro(@RequestBody Map<String, String> request) {
        String polished = aiService.polishIntroduction(request.get("introduction"));
        return ResponseEntity.ok(Map.of("polishedIntroduction", polished));
    }
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