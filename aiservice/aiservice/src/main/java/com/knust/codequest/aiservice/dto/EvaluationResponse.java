package com.knust.codequest.aiservice.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EvaluationResponse {
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> suggestions;
    private Double score;
    private String source;
}