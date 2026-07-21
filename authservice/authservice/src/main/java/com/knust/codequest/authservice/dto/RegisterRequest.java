package com.knust.codequest.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    /** Optional username. Defaults to the first name if not provided. */
    @Size(max = 40, message = "Username must be at most 40 characters")
    private String username;

    /** Optional target role (e.g. "Software Engineer"). Stored on the profile. */
    private String role;
}
