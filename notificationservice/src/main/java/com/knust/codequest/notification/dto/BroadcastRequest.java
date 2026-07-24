package com.knust.codequest.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body for the internal broadcast endpoint (admin/dev only).
 *
 * - audience=USER → `userId` is required (targeted message).
 * - audience in {BROADCAST, SYSTEM, DEV} → `userId` is ignored
 *   (stored as null so the message shows up in every user's inbox).
 *
 * `targetParams` is a free-form JSON string; the backend treats it as
 * opaque text. The mobile client parses it when navigating via the
 * deep link.
 */
public record BroadcastRequest(
    @NotBlank
    @Pattern(regexp = "USER|BROADCAST|SYSTEM|DEV",
             message = "audience must be one of USER, BROADCAST, SYSTEM, DEV")
    String audience,

    @NotBlank @Size(max = 64) String type,
    @NotBlank @Size(max = 256) String title,
    @NotBlank @Size(max = 1024) String body,
    @Size(max = 32) String emoji,
    @Size(max = 64) String cta,
    @Size(max = 64) String targetScreen,
    String targetParams,

    /** Only used when audience=USER. */
    String userId
) {}
