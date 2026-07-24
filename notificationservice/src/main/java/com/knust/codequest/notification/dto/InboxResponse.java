package com.knust.codequest.notification.dto;

import java.util.List;

/**
 * Inbox payload: the visible items plus the user's current unread count
 * (so the bell badge can be rendered without a second round-trip).
 */
public record InboxResponse(
    List<InAppNotificationDto> items,
    long unreadCount
) {}
