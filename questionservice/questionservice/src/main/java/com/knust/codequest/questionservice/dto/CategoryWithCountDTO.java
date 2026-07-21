package com.knust.codequest.questionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryWithCountDTO {
    private UUID id;
    private String name;
    private String description;
    private long questionCount;
}