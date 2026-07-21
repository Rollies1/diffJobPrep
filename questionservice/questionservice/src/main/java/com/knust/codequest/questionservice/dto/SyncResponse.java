package com.knust.codequest.questionservice.dto;

import java.util.List;

/**
 * Result of a batch sync. Mirrors the frontend {@code SyncResponse} type 1:1.
 */
public class SyncResponse {

    private int applied;
    private List<String> conflicts;

    public SyncResponse() {}

    public SyncResponse(int applied, List<String> conflicts) {
        this.applied = applied;
        this.conflicts = conflicts;
    }

    public int getApplied() { return applied; }
    public void setApplied(int applied) { this.applied = applied; }
    public List<String> getConflicts() { return conflicts; }
    public void setConflicts(List<String> conflicts) { this.conflicts = conflicts; }
}
