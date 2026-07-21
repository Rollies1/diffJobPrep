package com.knust.codequest.questionservice.dto;

import java.util.List;

/**
 * Batch sync of user state changes (bookmarks/ratings/notes/completion).
 * Mirrors the frontend {@code SyncRequest} type 1:1.
 */
public class SyncRequest {

    private List<SyncChange> changes;

    public SyncRequest() {}

    public SyncRequest(List<SyncChange> changes) {
        this.changes = changes;
    }

    public List<SyncChange> getChanges() { return changes; }
    public void setChanges(List<SyncChange> changes) { this.changes = changes; }

    /** A single per-question state change. All optional fields are null-safe. */
    public static class SyncChange {
        private String questionId;
        private Boolean bookmarked;
        private Boolean completed;
        private Integer rating;
        private String notes;

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public Boolean getBookmarked() { return bookmarked; }
        public void setBookmarked(Boolean bookmarked) { this.bookmarked = bookmarked; }
        public Boolean getCompleted() { return completed; }
        public void setCompleted(Boolean completed) { this.completed = completed; }
        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
