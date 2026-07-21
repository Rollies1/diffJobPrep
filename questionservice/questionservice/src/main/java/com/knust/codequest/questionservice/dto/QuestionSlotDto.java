package com.knust.codequest.questionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Slot representation of a question for practice sessions.
 * <p>
 * Field names ({@code questionId}, {@code questionText}, {@code expectedKeywords})
 * deliberately match practiceservice's {@code QuestionSlotDto} so that Jackson
 * deserialization works across the service boundary without a shared library.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionSlotDto {
    private UUID questionId;
    private String questionText;
    private List<String> expectedKeywords;
}
