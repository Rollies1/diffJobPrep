package com.knust.codequest.practiceservice.dto;

import com.knust.codequest.practiceservice.entity.SessionStatus;

import java.util.UUID;

public record SessionDTO(
    UUID sessionId,
    SessionStatus status
) {}
