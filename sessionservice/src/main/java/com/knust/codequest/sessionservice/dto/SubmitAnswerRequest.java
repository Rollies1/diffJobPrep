package com.knust.codequest.sessionservice.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SubmitAnswerRequest {
    private UUID questionId;
    private String userResponse;

    public String getAnswer() {
        return userResponse;
    }
}
