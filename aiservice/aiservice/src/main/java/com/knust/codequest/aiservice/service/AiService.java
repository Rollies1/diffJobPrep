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

    /**
     * Conversational chat for the AI tutor. Tries the same provider failover
     * chain as {@link #evaluate}; returns a canned helpful reply if no
     * provider key is configured.
     */
    public String chat(String message) {
        if (message == null || message.isBlank()) {
            return "Hi! I'm your AI interview tutor. Ask me anything about system design, algorithms, or behavioral questions.";
        }

        try {
            if (isValidKey(groqApiKey)) {
                return chatViaGroq(message);
            }
        } catch (Exception e) {
            System.out.println("Groq chat unavailable: " + e.getMessage());
        }

        // Fallback: echo a helpful canned reply.
        return fallbackChat(message);
    }

    private String chatViaGroq(String message) throws Exception {
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content",
                                "You are JobPrep's AI interview tutor. Give clear, concise, practical advice."),
                        Map.of("role", "user", "content", message)
                ),
                "max_tokens", 400
        ));

        HttpResponse<String> response = sendRequest(
                "https://api.groq.com/openai/v1/chat/completions",
                "Bearer " + groqApiKey,
                requestBody);

        JsonNode json = objectMapper.readTree(response.body());
        return json.path("choices").path(0).path("message").path("content").asText(
                "I couldn't generate a response right now. Please try again.");
    }

    private String fallbackChat(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("system design")) {
            return "For system design, start by clarifying requirements (functional + non-functional), then sketch the high-level components (load balancer, app servers, DB, cache), discuss trade-offs (consistency vs availability, SQL vs NoSQL), and finish with bottleneck analysis and scaling strategy.";
        }
        if (lower.contains("behavioral")) {
            return "For behavioral questions, use the STAR method: Situation, Task, Action, Result. Keep it concise, focus on YOUR contribution, and end with a measurable outcome.";
        }
        if (lower.contains("algorithm") || lower.contains("coding")) {
            return "For coding interviews: clarify the problem, discuss edge cases, start with a brute-force solution, then optimize. Communicate your thought process throughout — interviewers care about HOW you think, not just the final code.";
        }
        return "Great question! In a real deployment this would be answered by the configured LLM provider (Groq/Gemini/OpenRouter). Set GROQ_API_KEY to get live responses. For now, try asking about system design, behavioral questions, or algorithms.";
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
        return "Category: " + request.getCategory() +
                " | Question: " + request.getQuestion() +
                " | Answer: " + request.getAnswer() +
                " | Evaluate and return ONLY JSON with these exact fields: strengths (array of strings), weaknesses (array of strings), suggestions (array of strings), score (number between 0 and 10)";
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