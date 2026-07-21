package com.knust.codequest.questionservice.dto;

public class UserActivityDto {
    private String actionType;
    private String timestamp;
    private Object payload; // Typically Map<String, Object> or String

    public UserActivityDto(String actionType, String timestamp, Object payload) {
        this.actionType = actionType;
        this.timestamp = timestamp;
        this.payload = payload;
    }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
