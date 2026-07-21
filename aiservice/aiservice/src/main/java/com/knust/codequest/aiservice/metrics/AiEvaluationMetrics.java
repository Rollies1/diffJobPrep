package com.knust.codequest.aiservice.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

/**
 * Micrometer metrics for AI evaluation observability.
 * <p>
 * Tracks: evaluation count, duration, token usage, cost, failures, rate limit hits.
 */
@Component
public class AiEvaluationMetrics {

    private final MeterRegistry meterRegistry;

    private final Counter evaluationCounter;
    private final Counter failureCounter;
    private final Counter rateLimitCounter;
    private final Counter retryCounter;
    private final Timer evaluationTimer;

    public AiEvaluationMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        this.evaluationCounter = Counter.builder("ai.evaluation.total")
            .description("Total number of AI evaluations initiated")
            .register(meterRegistry);

        this.failureCounter = Counter.builder("ai.evaluation.failed")
            .description("Total number of failed AI evaluations")
            .register(meterRegistry);

        this.rateLimitCounter = Counter.builder("ai.evaluation.rate_limited")
            .description("Total number of rate-limited requests")
            .register(meterRegistry);

        this.retryCounter = Counter.builder("ai.evaluation.retried")
            .description("Total number of manual retry attempts")
            .register(meterRegistry);

        this.evaluationTimer = Timer.builder("ai.evaluation.duration")
            .description("Time taken to complete an AI evaluation")
            .register(meterRegistry);
    }

    public void recordEvaluationStarted() {
        evaluationCounter.increment();
    }

    public void recordEvaluationFailed() {
        failureCounter.increment();
    }

    public void recordRateLimited() {
        rateLimitCounter.increment();
    }

    public void recordRetry() {
        retryCounter.increment();
    }

    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordDuration(Timer.Sample sample) {
        sample.stop(evaluationTimer);
    }

    public void recordTokenUsage(int tokensInput, int tokensOutput) {
        meterRegistry.counter("ai.evaluation.tokens.input").increment(tokensInput);
        meterRegistry.counter("ai.evaluation.tokens.output").increment(tokensOutput);
    }

    public void recordCost(BigDecimal costUsd) {
        meterRegistry.gauge("ai.evaluation.cost.usd", costUsd.doubleValue());
    }
}
