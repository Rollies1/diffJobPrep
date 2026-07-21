package com.knust.codequest.sessionservice.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CreateSessionRequest {
    private String userId;
    private UUID categoryId;
    private Difficulty difficulty;
    private int totalQuestions;

    public enum Difficulty { EASY, MEDIUM, HARD }
}
