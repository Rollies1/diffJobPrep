package com.knust.codequest.questionservice.dto;

import java.util.List;

public class SyncRequest {
    private String clientLastSyncTimestamp;
    private List<PendingActionDto> actions;
    private String deviceId;

    public SyncRequest() {}

    public SyncRequest(String clientLastSyncTimestamp, List<PendingActionDto> actions, String deviceId) {
        this.clientLastSyncTimestamp = clientLastSyncTimestamp;
        this.actions = actions;
        this.deviceId = deviceId;
    }

    public String getClientLastSyncTimestamp() {
        return clientLastSyncTimestamp;
    }

    public void setClientLastSyncTimestamp(String clientLastSyncTimestamp) {
        this.clientLastSyncTimestamp = clientLastSyncTimestamp;
    }

    public List<PendingActionDto> getActions() {
        return actions;
    }

    public void setActions(List<PendingActionDto> actions) {
        this.actions = actions;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
}
