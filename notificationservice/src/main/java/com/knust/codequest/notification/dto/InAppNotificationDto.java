package com.knust.codequest.notification.dto;

import com.knust.codequest.notification.entity.InAppNotification;

import java.time.Instant;

/**
 * DTO for an in-app notification, returned to the mobile client.
 *
 * The `id` is exposed as a String so the client doesn't need a UUID
 * parser; it's echoed back on mark-read POSTs.
 */
public record InAppNotificationDto(
    String id,
    String audience,
    String type,
    String title,
    String body,
    String emoji,
    String avatar,
    String cta,
    String targetScreen,
    String targetParams,
    Instant readAt,
    Instant createdAt
) {
    public static InAppNotificationDto from(InAppNotification e) {
        return new InAppNotificationDto(
            e.getId() != null ? e.getId().toString() : null,
            e.getAudience(),
            e.getType(),
            e.getTitle(),
            e.getBody(),
            e.getEmoji(),
            e.getAvatar(),
            e.getCta(),
            e.getTargetScreen(),
            e.getTargetParams(),
            e.getReadAt(),
            e.getCreatedAt()
        );
    }
}
