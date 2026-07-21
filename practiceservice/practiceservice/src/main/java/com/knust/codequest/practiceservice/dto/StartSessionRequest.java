package com.knust.codequest.practiceservice.dto;

import lombok.Data;

@Data
public class StartSessionRequest {
    private Long userId;
    private Long categoryId;
}