package com.knust.codequest.questionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryWithCountDTO {
    private Long id;
    private String name;
    private String description;
    private long questionCount;
}