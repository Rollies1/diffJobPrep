package com.knust.codequest.authservice.dto;

import com.knust.codequest.authservice.entity.User;

/**
 * Public user representation returned to the frontend.
 * Mirrors the frontend {@code UserDto} type 1:1.
 */
public record UserDto(
        Long id,
        String email,
        String name,
        String username,
        String bio,
        String role,
        String avatarUrl,
        boolean onboardingComplete,
        boolean isPremium,
        java.time.LocalDateTime premiumExpiry
) {
    /** Convenience factory using the common subset. */
    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getUsername(),
                user.getBio(),
                user.getRole(),
                user.getAvatarUrl(),
                Boolean.TRUE.equals(user.getOnboardingComplete()),
                Boolean.TRUE.equals(user.getIsPremium()),
                user.getPremiumExpiry()
        );
    }
}
