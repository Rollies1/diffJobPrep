package com.knust.codequest.aiservice.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Estimates LLM call cost in USD based on token usage.
 * <p>
 * Rates are configurable per model. Defaults approximate OpenAI GPT-4o pricing.
 * Update rates when switching providers or models.
 */
@Component
public class CostCalculator {

    // Default rates per 1M tokens (adjust in application.yml)
    private final BigDecimal inputRatePer1M;
    private final BigDecimal outputRatePer1M;

    private static final BigDecimal ONE_MILLION = new BigDecimal("1000000");

    public CostCalculator(
            @Value("${ai.cost.input-rate-per-1m:2.50}") BigDecimal inputRatePer1M,
            @Value("${ai.cost.output-rate-per-1m:10.00}") BigDecimal outputRatePer1M) {
        this.inputRatePer1M = inputRatePer1M;
        this.outputRatePer1M = outputRatePer1M;
    }

    /**
     * Calculates estimated cost for a single LLM call.
     *
     * @param tokensInput  prompt tokens consumed
     * @param tokensOutput completion tokens generated
     * @return estimated cost in USD
     */
    public BigDecimal calculate(int tokensInput, int tokensOutput) {
        BigDecimal inputCost = BigDecimal.valueOf(tokensInput)
            .multiply(inputRatePer1M)
            .divide(ONE_MILLION, 6, RoundingMode.HALF_UP);

        BigDecimal outputCost = BigDecimal.valueOf(tokensOutput)
            .multiply(outputRatePer1M)
            .divide(ONE_MILLION, 6, RoundingMode.HALF_UP);

        return inputCost.add(outputCost).setScale(4, RoundingMode.HALF_UP);
    }
}
