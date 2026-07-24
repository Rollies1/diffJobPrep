package com.knust.codequest.notification.service;

import com.knust.codequest.notification.dto.BroadcastRequest;
import com.knust.codequest.notification.dto.InAppNotificationDto;
import com.knust.codequest.notification.dto.InboxResponse;
import com.knust.codequest.notification.entity.InAppNotification;
import com.knust.codequest.notification.repository.InAppNotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * In-app notification "message center" operations.
 *
 * The mobile app's home bell + Notifications screen read from this
 * service. Messages are either targeted (audience=USER, userId set)
 * or broadcast (audience in {BROADCAST, SYSTEM, DEV}, userId null).
 *
 * Read-state lives on the row itself (readAt). For broadcast rows
 * this means read-state is shared across users in v1 — acceptable
 * because the inbox is short-lived (expiry handles cleanup).
 */
@Service
public class InAppNotificationService {

    /** Audiences that every user sees in their inbox. */
    private static final Set<String> BROADCAST_AUDIENCES =
        Set.of("BROADCAST", "SYSTEM", "DEV");

    private final InAppNotificationRepository repository;

    public InAppNotificationService(InAppNotificationRepository repository) {
        this.repository = repository;
    }

    /**
     * Fetch a user's inbox: their targeted messages plus all
     * broadcast/system/dev messages, newest first. Filters out
     * expired rows. If unreadOnly, also drops already-read rows.
     *
     * Unread count is computed from the filtered list (after expiry
     * and unread filtering) so the bell badge reflects what the user
     * actually sees, not raw row counts.
     */
    @Transactional(readOnly = true)
    public InboxResponse getInbox(String userId, boolean unreadOnly) {
        Instant now = Instant.now();
        List<InAppNotification> rows = repository
            .findByUserIdOrAudienceInOrderByCreatedAtDesc(userId, BROADCAST_AUDIENCES);

        List<InAppNotificationDto> items = rows.stream()
            .filter(n -> n.getExpiresAt() == null || n.getExpiresAt().isAfter(now))
            .filter(n -> !unreadOnly || n.getReadAt() == null)
            .map(InAppNotificationDto::from)
            .toList();

        long unreadCount = items.stream()
            .filter(dto -> dto.readAt() == null)
            .count();

        return new InboxResponse(items, unreadCount);
    }

    /**
     * Unread count for the bell badge. Broadcast audiences are
     * BROADCAST, SYSTEM, DEV.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String userId) {
        return repository.countByUserIdOrAudienceInAndReadAtIsNull(
            userId, BROADCAST_AUDIENCES);
    }

    /**
     * Mark a single notification as read. Access check: the row is
     * readable if it was targeted at this user (userId matches) OR
     * it's a broadcast-style row (audience != USER).
     */
    @Transactional
    public void markRead(UUID id, String userId) {
        InAppNotification n = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "notification not found: " + id));

        boolean canAccess = userId.equals(n.getUserId())
            || !"USER".equals(n.getAudience());
        if (!canAccess) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "not allowed to read this notification");
        }

        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
            repository.save(n);
        }
    }

    /**
     * Mark every targeted-to-user row as read. Does NOT touch
     * broadcast rows (those have userId=null). Returns the number
     * of rows updated.
     */
    @Transactional
    public long markAllRead(String userId) {
        return repository.markAllReadForUser(userId, Instant.now());
    }

    /**
     * Create (broadcast) a new in-app notification.
     *
     * If audience=USER, userId is required and stored on the row.
     * Otherwise userId is ignored (stored as null) so the message
     * shows up in every user's inbox.
     */
    @Transactional
    public InAppNotificationDto broadcast(BroadcastRequest req) {
        InAppNotification n = new InAppNotification();
        if ("USER".equals(req.audience())) {
            if (req.userId() == null || req.userId().isBlank()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "userId is required for audience=USER");
            }
            n.setUserId(req.userId());
        }
        n.setAudience(req.audience());
        n.setType(req.type());
        n.setTitle(req.title());
        n.setBody(req.body());
        n.setEmoji(req.emoji());
        n.setCta(req.cta());
        n.setTargetScreen(req.targetScreen());
        n.setTargetParams(req.targetParams());
        return InAppNotificationDto.from(repository.save(n));
    }
}
