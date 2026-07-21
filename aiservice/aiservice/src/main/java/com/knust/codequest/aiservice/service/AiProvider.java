package com.knust.codequest.aiservice.service;

import com.knust.codequest.aiservice.dto.AiEvaluationResult;
import com.knust.codequest.aiservice.dto.AnswerDTO;

import java.util.List;

/**
 * Abstraction over AI providers (OpenAI, Anthropic, Gemini, Ollama, Mock).
 * <p>
 * Phase 2: Returns {@link EvaluationOutput} which bundles the structured result
 * with token usage and raw response metadata for cost tracking and debugging.
 */
public interface AiProvider {

    /**
     * Evaluates a list of user answers and returns structured feedback plus metadata.
     *
     * @param answers the question/answer pairs to evaluate
     * @return evaluation result with token usage and raw LLM output
     */
    EvaluationOutput evaluateAnswers(List<AnswerDTO> answers);

    /**
     * Returns the version identifier of the prompt/engineering strategy used.
     * Critical for idempotency and A/B testing.
     */
    String getPromptVersion();

    /**
     * Wrapper for AI evaluation result including observability metadata.
     */
    record EvaluationOutput(
        AiEvaluationResult result,
        Integer tokensInput,
        Integer tokensOutput,
        String rawResponse
    ) {}
}
