package com.knust.codequest.sessionservice.service;

import com.knust.codequest.sessionservice.model.entity.CompletedSession;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Instant;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class XpCalculatorTest {

    private final XpCalculator calculator = new XpCalculator();

    private static Stream<Arguments> provideXpScenarios() {
        return Stream.of(
                // answered, score, deckId, maxCombo, streakDays, speedMs, dailyFirst, expectedXp
                Arguments.of(5, 100, "default", 0, 0, 0, false, 200),
                Arguments.of(5, 80, "default", 0, 0, 0, false, 113),
                Arguments.of(5, 50, "default", 0, 0, 0, false, 90),
                Arguments.of(5, 40, "default", 0, 0, 0, false, 75),
                Arguments.of(5, 100, "system-design", 0, 0, 0, false, 300),
                Arguments.of(5, 100, "behavioral", 0, 0, 0, false, 150),
                Arguments.of(5, 100, "default", 10, 0, 0, false, 275),
                Arguments.of(5, 100, "default", 5, 0, 0, false, 230),
                Arguments.of(5, 100, "default", 3, 0, 0, false, 215),
                Arguments.of(5, 100, "default", 0, 10, 0, false, 275),
                Arguments.of(5, 100, "default", 0, 0, 30000, false, 220),
                Arguments.of(5, 100, "default", 0, 0, 60000, false, 200),
                Arguments.of(5, 100, "default", 0, 0, 0, true, 300),
                Arguments.of(0, 100, "default", 0, 0, 0, false, 0)
        );
    }

    @ParameterizedTest
    @MethodSource("provideXpScenarios")
    void calculateXp_returnsExpectedXp(int answered, int score, String deckId, int maxCombo, int streakDays, int speedMs, boolean dailyFirst, int expectedXp) {
        CompletedSession session = new CompletedSession(
                UUID.randomUUID(),
                UUID.randomUUID(),
                deckId,
                score,
                10,
                answered,
                60000,
                Instant.now()
        );

        XpCalculator.XpCalculationResult result = calculator.calculateXp(session, streakDays, maxCombo, speedMs, dailyFirst);

        assertEquals(expectedXp, result.totalXp());
    }

    @Nested
    class LevelAndRank {

        @Test
        void getLevelFromXp_boundaries() {
            assertEquals(1, calculator.getLevelFromXp(0));
            assertEquals(1, calculator.getLevelFromXp(99));
            assertEquals(2, calculator.getLevelFromXp(100));
        }

        @Test
        void getXpForLevel_boundaries() {
            assertEquals(0, calculator.getXpForLevel(1));
            assertEquals(100, calculator.getXpForLevel(2));
        }

        @Test
        void getRankName_tiers() {
            assertEquals("Bronze", calculator.getRankName(9));
            assertEquals("Silver", calculator.getRankName(10));
            assertEquals("Gold", calculator.getRankName(34));
            assertEquals("Platinum", calculator.getRankName(49));
            assertEquals("Diamond", calculator.getRankName(74));
            assertEquals("Grandmaster", calculator.getRankName(75));
        }
    }
}
