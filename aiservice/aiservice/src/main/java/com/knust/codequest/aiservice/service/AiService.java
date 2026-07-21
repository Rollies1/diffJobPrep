package com.knust.codequest.aiservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.aiservice.dto.EvaluationRequest;
import com.knust.codequest.aiservice.dto.EvaluationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${openrouter.api.key}")
    private String openrouterApiKey;

    @Value("${qwen.api.key}")
    private String qwenApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public EvaluationResponse evaluate(EvaluationRequest request) {
        try {
            if (isValidKey(groqApiKey)) {
                return groqEvaluate(request);
            }
        } catch (Exception e) {
            System.out.println("Groq unavailable: " + e.getMessage());
        }

        try {
            if (isValidKey(geminiApiKey)) {
                return geminiEvaluate(request);
            }
        } catch (Exception e) {
            System.out.println("Gemini unavailable: " + e.getMessage());
        }

        try {
            if (isValidKey(openrouterApiKey)) {
                return openrouterEvaluate(request);
            }
        } catch (Exception e) {
            System.out.println("OpenRouter unavailable: " + e.getMessage());
        }

        try {
            if (isValidKey(qwenApiKey)) {
                return qwenEvaluate(request);
            }
        } catch (Exception e) {
            System.out.println("Qwen unavailable: " + e.getMessage());
        }

        return fallbackEvaluate(request);
    }

    public String polishIntroduction(String rawIntro) {
        if (rawIntro == null || rawIntro.isBlank()) {
            return "";
        }

        try {
            if (isValidKey(groqApiKey)) {
                return polishWithGroq(rawIntro);
            }
        } catch (Exception e) {
            System.out.println("Groq polish failed: " + e.getMessage());
        }

        // Fallback: return original text, lightly cleaned
        return rawIntro.trim();
    }

    private String polishWithGroq(String rawIntro) throws Exception {
        String prompt = "You are a professional CV writer. Rewrite this introduction to sound polished, confident and personalized. " +
                "Use the person's actual background mentioned in the text. " +
                "Vary your language - avoid cliches like 'results-driven' or 'detail-oriented'. " +
                "Make it sound human and specific. Keep it 2-3 sentences. " +
                "Return ONLY the rewritten text, no preamble, no quotes: " + rawIntro;

        String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a professional resume writer. Return only the polished text, no preamble, no quotes."),
                        Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 200
        ));

        HttpResponse<String> response = sendRequest(
                "https://api.groq.com/openai/v1/chat/completions",
                "Bearer " + groqApiKey,
                requestBody
        );

        JsonNode root = objectMapper.readTree(response.body());
        if (root.has("error")) {
            throw new RuntimeException("Groq error: " + root.path("error").path("message").asText());
        }

        return root.path("choices").get(0).path("message").path("content").asText().trim();
    }

    private boolean isValidKey(String key) {
        if (key == null) return false;
        String trimmed = key.trim();
        return !trimmed.isEmpty() && !trimmed.startsWith("YOUR_");
    }

    private EvaluationResponse groqEvaluate(EvaluationRequest request) throws Exception {
        String prompt = buildPrompt(request);
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content", "You are an interview evaluation engine. Return ONLY a JSON object with fields: strengths (array), weaknesses (array), suggestions (array), score (number 0-10). No markdown, no explanation."),
                        Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 500
        ));

        HttpResponse<String> response = sendRequest(
                "https://api.groq.com/openai/v1/chat/completions",
                "Bearer " + groqApiKey,
                requestBody
        );

        System.out.println("DEBUG - Groq response: " + response.body());
        return parseOpenAIResponse(response.body(), "GROQ");
    }

    private EvaluationResponse geminiEvaluate(EvaluationRequest request) throws Exception {
        String prompt = buildPrompt(request);
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        ));

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = client.send(httpRequest,
                HttpResponse.BodyHandlers.ofString());

        System.out.println("DEBUG - Gemini response: " + response.body());

        JsonNode root = objectMapper.readTree(response.body());
        if (root.has("error")) {
            throw new RuntimeException("Gemini error: " + root.path("error").path("message").asText());
        }

        String content = root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();
        content = content.replace("```json", "").replace("```", "").trim();
        return parseFeedbackJson(content, "GEMINI");
    }

    private EvaluationResponse openrouterEvaluate(EvaluationRequest request) throws Exception {
        String prompt = buildPrompt(request);
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", "mistralai/mistral-7b-instruct:free",
                "messages", List.of(
                        Map.of("role", "system", "content", "You are an interview evaluation engine. Return ONLY a JSON object with fields: strengths (array), weaknesses (array), suggestions (array), score (number 0-10). No markdown, no explanation."),
                        Map.of("role", "user", "content", prompt)
                )
        ));



        HttpResponse<String> response = sendRequest(
                "https://openrouter.ai/api/v1/chat/completions",
                "Bearer " + openrouterApiKey,
                requestBody
        );

        System.out.println("DEBUG - OpenRouter response: " + response.body());
        return parseOpenAIResponse(response.body(), "OPENROUTER");
    }

    private EvaluationResponse qwenEvaluate(EvaluationRequest request) throws Exception {
        String prompt = buildPrompt(request);
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", "qwen-plus",
                "messages", List.of(
                        Map.of("role", "system", "content", "You are an interview evaluation engine. Return ONLY a JSON object with fields: strengths (array), weaknesses (array), suggestions (array), score (number 0-10). No markdown, no explanation."),
                        Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 500
        ));

        HttpResponse<String> response = sendRequest(
                "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                "Bearer " + qwenApiKey,
                requestBody
        );

        System.out.println("DEBUG - Qwen response: " + response.body());
        return parseOpenAIResponse(response.body(), "QWEN");
    }

    private HttpResponse<String> sendRequest(String url, String auth, String body) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", auth)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private EvaluationResponse parseOpenAIResponse(String responseBody, String source) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        if (root.has("error")) {
            throw new RuntimeException("API error: " + root.path("error").path("message").asText());
        }
        String content = root.path("choices").get(0)
                .path("message").path("content").asText();
        content = content.replace("```json", "").replace("```", "").trim();
        return parseFeedbackJson(content, source);
    }

    private EvaluationResponse parseFeedbackJson(String content, String source) throws Exception {
        JsonNode feedback = objectMapper.readTree(content);
        EvaluationResponse result = new EvaluationResponse();
        result.setStrengths(objectMapper.convertValue(feedback.path("strengths"),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
        result.setWeaknesses(objectMapper.convertValue(feedback.path("weaknesses"),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
        result.setSuggestions(objectMapper.convertValue(feedback.path("suggestions"),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));
        result.setScore(feedback.path("score").asDouble());
        result.setSource(source);
        return result;
    }

    private String buildPrompt(EvaluationRequest request) {
        return "You are a fair and encouraging interview coach evaluating a student's answer. " +
                "Category: " + request.getCategory() + " | " +
                "Question: " + request.getQuestion() + " | " +
                "Answer: " + request.getAnswer() + " | " +
                "SCORING GUIDE: Be generous and encouraging. " +
                "Give 7-8 for answers that cover the main concepts even if incomplete. " +
                "Give 5-6 for partially correct answers. " +
                "Give 3-4 for answers showing basic understanding. " +
                "Only give below 3 for completely wrong or empty answers. " +
                "Focus on what the student got RIGHT first. " +
                "Return ONLY JSON: {\"strengths\": [], \"weaknesses\": [], \"suggestions\": [], \"score\": 0-10}";
    }

    private EvaluationResponse fallbackEvaluate(EvaluationRequest request) {
        String answer = request.getAnswer() == null ? "" : request.getAnswer().trim();
        int wordCount = answer.isEmpty() ? 0 : answer.split("\\s+").length;
        double score = 0;

        if (wordCount == 0) {
            return new EvaluationResponse(
                    List.of(),
                    List.of("No answer provided"),
                    List.of("Please provide an answer to be evaluated"),
                    0.0, "FALLBACK"
            );
        }

        if (wordCount < 20) score = 3;
        else if (wordCount < 80) score = 5;
        else score = 6;

        String lower = answer.toLowerCase();
        if (lower.contains("because") || lower.contains("for example") ||
                lower.contains("such as") || lower.contains("therefore")) score += 1;

        if (request.getCategory() != null) {
            String cat = request.getCategory().toLowerCase();
            if (cat.contains("network") &&
                    (lower.contains("tcp") || lower.contains("ip") ||
                            lower.contains("protocol") || lower.contains("packet"))) score += 2;
            else if (cat.contains("software") &&
                    (lower.contains("api") || lower.contains("class") ||
                            lower.contains("object") || lower.contains("method"))) score += 2;
            else if ((cat.contains("security") || cat.contains("cyber")) &&
                    (lower.contains("encrypt") || lower.contains("firewall") ||
                            lower.contains("vulnerability") || lower.contains("authentication"))) score += 2;
        }

        score = Math.min(score, 10);

        return new EvaluationResponse(
                List.of("Answer provided", wordCount > 50 ? "Good detail level" : "Basic response given"),
                wordCount < 50 ? List.of("Answer could be more detailed") : List.of("Could include more examples"),
                List.of("Add specific examples", "Use technical terminology", "Structure your answer clearly"),
                score, "FALLBACK"
        );
    }
}