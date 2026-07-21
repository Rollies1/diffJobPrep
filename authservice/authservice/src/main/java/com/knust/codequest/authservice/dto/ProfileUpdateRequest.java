package com.knust.codequest.authservice.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/** Partial profile update — all fields optional, null = leave unchanged. */
@Data
public class ProfileUpdateRequest {

    @Size(max = 40, message = "Username must be at most 40 characters")
    private String username;

    @Size(max = 255, message = "Name must be at most 255 characters")
    private String name;

    @Size(max = 500, message = "Bio must be at most 500 characters")
    private String bio;

    private String avatarUrl;

    private Boolean onboardingComplete;
}
