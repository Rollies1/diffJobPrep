package com.knust.codequest.questionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckDto {
    private String id;
    private String title;
    private String category;
    private String color;
    private int questionCount;
    private int completedCount;
}
