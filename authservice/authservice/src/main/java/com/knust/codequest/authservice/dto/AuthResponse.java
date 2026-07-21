package com.knust.codequest.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Auth response returned by /register, /login, and /refresh.
 * Mirrors the frontend {@code AuthResponse} type 1:1:
 *   { user, accessToken, refreshToken }
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    private UserDto user;
    private String accessToken;
    private String refreshToken;
}
