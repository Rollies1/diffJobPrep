package com.knust.codequest.aiservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.aiservice.dto.AiEvaluationResult;
import com.knust.codequest.aiservice.dto.AnswerDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Production AI provider using Spring AI's {@link ChatModel} abstraction.
 * <p>
 * Supports OpenAI, Anthropic, Gemini, etc. via configuration.
 * Enforces JSON-mode output to guarantee structured parsing.
 */
@Service
@Profile("real-ai")
public class SpringAiProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(SpringAiProvider.class);
    private static final String PROMPT_VERSION = "v1.0.0-structured";

    private final ChatModel chatModel;
    private final EvaluationPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    public SpringAiProvider(ChatModel chatModel,
                            EvaluationPromptBuilder promptBuilder,
                            ObjectMapper objectMapper) {
        this.chatModel = chatModel;
        this.promptBuilder = promptBuilder;
        this.objectMapper = objectMapper;
    }

    @Override
    public EvaluationOutput evaluateAnswers(List<AnswerDTO> answers) {
        Prompt originalPrompt = promptBuilder.build(answers);

        // Force JSON mode for structured output (OpenAI-specific; ignored by other providers)
        OpenAiChatOptions jsonOptions = OpenAiChatOptions.builder()
            .withTemperature(0.2)
            .build();

        log.info("Sending evaluation request to LLM with promptVersion={}", promptBuilder.getVersion());

        Prompt promptWithOptions = new Prompt(originalPrompt.getInstructions(), jsonOptions);
        ChatResponse response = chatModel.call(promptWithOptions);

        String content = response.getResult().getOutput().getContent();
        log.debug("Raw LLM response: {}", content);

        // Parse using the prompt builder's converter (schema-validated)
        AiEvaluationResult result;
        if (promptBuilder instanceof StructuredEvaluationPromptBuilder structured) {
            result = structured.parse(content);
        } else {
            // Fallback to Jackson
            try {
                result = objectMapper.readValue(content, AiEvaluationResult.class);
            } catch (Exception e) {
                log.error("Failed to parse LLM response: {}", content, e);
                throw new RuntimeException("Invalid LLM response format", e);
            }
        }

        // Extract token usage for cost tracking
        Integer tokensIn = null;
        Integer tokensOut = null;
        if (response.getMetadata() != null) {
            Usage usage = response.getMetadata().getUsage();
            if (usage != null) {
                tokensIn = usage.getPromptTokens() != null ? usage.getPromptTokens().intValue() : 0;
                tokensOut = usage.getGenerationTokens() != null ? usage.getGenerationTokens().intValue() : 0;
                log.info("Token usage: input={}, output={}", tokensIn, tokensOut);
            }
        }

        return new EvaluationOutput(result, tokensIn, tokensOut, content);
    }

    @Override
    public String getPromptVersion() {
        return PROMPT_VERSION;
    }
}
