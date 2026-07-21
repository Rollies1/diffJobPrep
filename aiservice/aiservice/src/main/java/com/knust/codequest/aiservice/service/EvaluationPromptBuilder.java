package com.knust.codequest.aiservice.service;

import com.knust.codequest.aiservice.dto.AnswerDTO;
import org.springframework.ai.chat.prompt.Prompt;

import java.util.List;

/**
 * Isolates prompt engineering from AI provider plumbing.
 * <p>
 * Implementations define how questions/answers are formatted into LLM messages.
 * Changing the prompt strategy increments the version, enabling A/B testing and
 * correlation of score drift with prompt releases.
 */
public interface EvaluationPromptBuilder {

    /**
     * Builds a {@link Prompt} from the given answers.
     *
     * @param answers question/answer pairs to evaluate
     * @return the prompt ready for the LLM
     */
    Prompt build(List<AnswerDTO> answers);

    /**
     * Version of the prompt strategy. Must change when prompt text or schema changes.
     */
    String getVersion();
}
