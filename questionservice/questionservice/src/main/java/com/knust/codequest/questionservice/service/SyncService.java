package com.knust.codequest.questionservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.questionservice.dto.PendingActionDto;
import com.knust.codequest.questionservice.dto.QuestionDto;
import com.knust.codequest.questionservice.dto.SyncRequest;
import com.knust.codequest.questionservice.dto.SyncResponse;
import com.knust.codequest.questionservice.entity.ActionLog;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.entity.UserQuestionState;
import com.knust.codequest.questionservice.repository.ActionLogRepository;
import com.knust.codequest.questionservice.repository.QuestionRepository;
import com.knust.codequest.questionservice.repository.UserQuestionStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final UserQuestionStateRepository stateRepository;
    private final ActionLogRepository actionLogRepository;
    private final ObjectMapper objectMapper;
    private final QuestionRepository questionRepository;

    // ─── Public: Batch Sync (from mobile offline queue) ───
    @Transactional
    public SyncResponse processBatch(String userId, String deviceId, SyncRequest request) {
        return process(userId, deviceId, request.getActions() != null ? request.getActions() : Collections.emptyList(), true);
    }


    // ─── Core Engine (both paths converge here) ──────────
    private SyncResponse process(String userId, String deviceId, List<PendingActionDto> actions, boolean isBatch) {
        List<String> acknowledged = new ArrayList<>();

        if (actions != null && !actions.isEmpty()) {
            List<String> incomingIds = actions.stream()
                    .map(PendingActionDto::getActionId)
                    .collect(Collectors.toList());

            Set<String> existing = actionLogRepository.findExistingIds(userId, incomingIds);

            for (PendingActionDto action : actions) {
                if (existing.contains(action.getActionId())) {
                    acknowledged.add(action.getActionId());
                    continue;
                }

                try {
                    applyAction(userId, deviceId, action);
                    
                    // Log the action to prevent re-processing
                    ActionLog logEntry = new ActionLog();
                    logEntry.setActionId(action.getActionId());
                    logEntry.setUserId(userId);
                    logEntry.setDeviceId(deviceId);
                    logEntry.setActionType(action.getType());
                    
                    String targetId = action.getTargetId() != null ? action.getTargetId() : action.getQuestionId();
                    logEntry.setTargetId(targetId);
                    
                    try {
                        logEntry.setPayload(objectMapper.writeValueAsString(action.getPayload()));
                    } catch (JsonProcessingException e) {
                        logEntry.setPayload("{}");
                    }
                    
                    logEntry.setClientTimestamp(action.getClientTimestamp() != null 
                        ? Instant.parse(action.getClientTimestamp()) 
                        : Instant.now());
                    logEntry.setServerAppliedAt(Instant.now());
                    
                    actionLogRepository.save(logEntry);
                    acknowledged.add(action.getActionId());
                } catch (Exception e) {
                    log.error("Failed to process action: {}", action.getActionId(), e);
                }
            }
        }

        // Return server changes if we want to support full sync, for now just empty
        return new SyncResponse(acknowledged, Collections.emptyList(), Instant.now().toString());
    }

    private void applyAction(String userId, String deviceId, PendingActionDto action) {
        String type = action.getType();
        String questionId = action.getTargetId() != null ? action.getTargetId() : action.getQuestionId();
        Map<String, Object> payload = action.getPayload();

        UserQuestionState state = stateRepository.findByUserIdAndQuestionIdAndDeviceId(userId, questionId, deviceId)
                .orElseGet(() -> {
                    UserQuestionState newState = new UserQuestionState();
                    newState.setUserId(userId);
                    newState.setQuestionId(questionId);
                    newState.setDeviceId(deviceId);
                    return newState;
                });

        switch (type) {
            case "BOOKMARK_TOGGLE":
                if (payload != null && payload.containsKey("bookmarked")) {
                    boolean bookmarked = Boolean.parseBoolean(payload.get("bookmarked").toString());
                    state.setBookmarked(bookmarked);
                }
                break;
            case "QUESTION_COMPLETE":
                state.setCompleted(true);
                state.setLastPracticedAt(action.getClientTimestamp() != null 
                    ? Instant.parse(action.getClientTimestamp()) 
                    : Instant.now());
                break;
            case "RATE_QUESTION":
                if (payload != null && payload.containsKey("rating")) {
                    int rating = Integer.parseInt(payload.get("rating").toString());
                    state.setRating(rating);
                }
                break;
            case "ADD_NOTE":
                if (payload != null && payload.containsKey("content")) {
                    state.setNotes(payload.get("content").toString());
                }
                break;
            case "CLEAR_NOTE":
                state.setNotes(null);
                break;
            default:
                log.warn("Unknown action type: {}", type);
        }
        
        state.setServerUpdatedAt(Instant.now());
        stateRepository.save(state);
    }
}
