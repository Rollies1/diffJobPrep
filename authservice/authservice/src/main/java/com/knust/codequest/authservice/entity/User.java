package com.knust.codequest.authservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    /** Unique username for @mentions + profile URL. Defaults to first name on registration. */
    @Column(unique = true, length = 40)
    private String username;

    /** Short user-authored bio shown on the profile. */
    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false)
    private String role = "USER";

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    /** Premium entitlement flag (driven by RevenueCat webhooks). */
    @Column(name = "is_premium", nullable = false)
    private Boolean isPremium = false;

    /** When the current premium entitlement expires (null = never/free). */
    @Column(name = "premium_expiry")
    private LocalDateTime premiumExpiry;

    /** Optional user-uploaded avatar URL (null → use initial-based avatar). */
    @Column(name = "avatar_url")
    private String avatarUrl;

    /** Whether the user has completed the post-registration onboarding flow. */
    @Column(name = "onboarding_complete", nullable = false)
    private Boolean onboardingComplete = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
