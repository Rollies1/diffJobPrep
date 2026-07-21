package com.knust.codequest.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request to register or refresh a device token.
 *
 * Idempotent on (userId, deviceId) — calling twice with the same deviceId
 * updates the token instead of creating a duplicate. This handles the
 * common case where Expo rotates a token for the same physical device.
 */
public record RegisterDeviceRequest(
    @NotBlank @Size(max = 512) String token,
    @NotBlank String platform,   // "ios" | "android" | "web"
    @NotBlank @Size(max = 128) String deviceId,
    @Size(max = 64) String timezone,   // IANA tz, defaults to UTC
    @Size(max = 16) String locale,     // defaults to "en"
    @Size(max = 32) String appVersion,
    @Size(max = 32) String osVersion
) {}
