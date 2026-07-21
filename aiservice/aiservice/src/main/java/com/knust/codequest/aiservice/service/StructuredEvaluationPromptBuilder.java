package com.knust.codequest.aiservice.service;

import com.knust.codequest.aiservice.dto.AiEvaluationResult;
import com.knust.codequest.aiservice.dto.AnswerDTO;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Prompt builder that enforces structured JSON output via schema injection.
 * <p>
 * Uses Spring AI's {@link BeanOutputConverter} to generate the JSON schema
 * from {@link AiEvaluationResult}, eliminating fragile regex parsing.
 */
@Component
public class StructuredEvaluationPromptBuilder implements EvaluationPromptBuilder {

    private static final String VERSION = "v1.0.1-structured";
    private final BeanOutputConverter<AiEvaluationResult> outputConverter;
    
    @org.springframework.beans.factory.annotation.Value("classpath:/prompts/evaluation-system.st")
    private org.springframework.core.io.Resource systemPromptResource;

    public StructuredEvaluationPromptBuilder() {
        this.outputConverter = new BeanOutputConverter<>(AiEvaluationResult.class);
    }

    @Override
    public Prompt build(List<AnswerDTO> answers) {
        String jsonSchema = outputConverter.getFormat();

        SystemPromptTemplate systemTemplate = new SystemPromptTemplate(systemPromptResource);
        var systemMessage = systemTemplate.createMessage(Map.of("schema", jsonSchema));

        StringBuilder userText = new StringBuilder();
        userText.append("Evaluate the following interview answers:\n\n");
        for (int i = 0; i < answers.size(); i++) {
            AnswerDTO a = answers.get(i);
            userText.append("--- Question ").append(i + 1).append(" ---\n");
            userText.append("Question: ").append(a.questionText()).append("\n");
            userText.append("Expected Keywords: ")
                .append(a.expectedKeywords() != null ? String.join(", ", a.expectedKeywords()) : "N/A")
                .append("\n");
            userText.append("Candidate Answer: ").append(a.userAnswer()).append("\n\n");
        }

        var userMessage = new org.springframework.ai.chat.messages.UserMessage(userText.toString());

        return new Prompt(List.of(systemMessage, userMessage));
    }

    @Override
    public String getVersion() {
        return VERSION;
    }

    /**
     * Converts raw LLM JSON string into {@link AiEvaluationResult}.
     * Use this in the provider to parse responses consistently.
     */
    public AiEvaluationResult parse(String rawJson) {
        return outputConverter.convert(rawJson);
    }
}
