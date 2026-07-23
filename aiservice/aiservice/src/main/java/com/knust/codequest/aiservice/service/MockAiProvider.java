package com.knust.codequest.aiservice.service;

import com.knust.codequest.aiservice.dto.AiEvaluationResult;
import com.knust.codequest.aiservice.dto.AnswerDTO;
import com.knust.codequest.aiservice.dto.QuestionEvaluation;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Scaffold implementation for immediate UI testing.
 * Returns hardcoded/structured feedback without external API calls.
 */
@Service
@Profile({"mock-ai", "default", "dev"})
@Primary
public class MockAiProvider implements AiProvider {

    private static final String PROMPT_VERSION = "v0.1.0-mock";

    @Override
    public EvaluationOutput evaluateAnswers(List<AnswerDTO> answers) {
        try {
            Thread.sleep(ThreadLocalRandom.current().nextInt(200, 800));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        var feedback = answers.stream()
            .map(a -> new QuestionEvaluation(
                a.questionId(),
                Math.round(ThreadLocalRandom.current().nextDouble(60, 100) * 100.0) / 100.0,
                "Mock feedback: Good attempt but could expand on key concepts.",
                List.of("missing detail A", "missing detail B"),
                List.of("clear structure", "good examples")
            ))
            .toList();

        double overall = feedback.stream()
            .mapToDouble(QuestionEvaluation::score)
            .average()
            .orElse(0.0);

        var result = new AiEvaluationResult(
            feedback,
            Math.round(overall * 100.0) / 100.0,
            "Mock summary: Solid foundation with room for improvement in depth and specificity."
        );

        return new EvaluationOutput(result, 0, 0, "mock-raw-response");
    }

    @Override
    public String getPromptVersion() {
        return PROMPT_VERSION;
    }
}
