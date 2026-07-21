package com.knust.codequest.questionservice.dto;

import java.util.Map;

public class PendingActionDto {
    private String actionId;
    private String type;
    private String targetId;
    private String questionId; // Legacy
    private Map<String, Object> payload;
    private String clientTimestamp;

    public PendingActionDto() {}

    public String getActionId() {
        return actionId;
    }

    public void setActionId(String actionId) {
        this.actionId = actionId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }

    public String getClientTimestamp() {
        return clientTimestamp;
    }

    public void setClientTimestamp(String clientTimestamp) {
        this.clientTimestamp = clientTimestamp;
    }
}
