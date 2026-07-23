package com.knust.codequest.questionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private String id;
    private String deckId;
    private String title;
    private String content;
    private String difficulty;
    private String hint;
    private String category;
    /** Fine-grained sub-topic within the deck (e.g. "Hooks", "Closures"). */
    private String subTopic;
    private java.util.List<String> options;

    // User-specific state
    private boolean bookmarked;
    private boolean completed;
    private Integer rating;
    private String notes;
}
