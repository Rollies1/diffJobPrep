package com.knust.codequest.questionservice.dto;

import java.util.List;

public class SyncResponse {
    private List<String> acknowledgedActionIds;
    private List<QuestionDto> serverChanges;
    private String serverTimestamp;

    public SyncResponse() {}

    public SyncResponse(List<String> acknowledgedActionIds, List<QuestionDto> serverChanges, String serverTimestamp) {
        this.acknowledgedActionIds = acknowledgedActionIds;
        this.serverChanges = serverChanges;
        this.serverTimestamp = serverTimestamp;
    }

    public List<String> getAcknowledgedActionIds() {
        return acknowledgedActionIds;
    }

    public void setAcknowledgedActionIds(List<String> acknowledgedActionIds) {
        this.acknowledgedActionIds = acknowledgedActionIds;
    }

    public List<QuestionDto> getServerChanges() {
        return serverChanges;
    }

    public void setServerChanges(List<QuestionDto> serverChanges) {
        this.serverChanges = serverChanges;
    }

    public String getServerTimestamp() {
        return serverTimestamp;
    }

    public void setServerTimestamp(String serverTimestamp) {
        this.serverTimestamp = serverTimestamp;
    }
}
