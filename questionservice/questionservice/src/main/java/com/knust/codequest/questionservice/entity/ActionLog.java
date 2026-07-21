package com.knust.codequest.questionservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "action_log")
public class ActionLog {

    @Id
    private String actionId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String deviceId;

    @Column(nullable = false)
    private String actionType;

    @Column(nullable = false)
    private String targetId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Column(nullable = false)
    private Instant clientTimestamp;

    @Column(nullable = false)
    private Instant serverAppliedAt;

    public ActionLog() {
    }

    public String getActionId() {
        return actionId;
    }

    public void setActionId(String actionId) {
        this.actionId = actionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public Instant getClientTimestamp() {
        return clientTimestamp;
    }

    public void setClientTimestamp(Instant clientTimestamp) {
        this.clientTimestamp = clientTimestamp;
    }

    public Instant getServerAppliedAt() {
        return serverAppliedAt;
    }

    public void setServerAppliedAt(Instant serverAppliedAt) {
        this.serverAppliedAt = serverAppliedAt;
    }
}
