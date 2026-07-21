package com.knust.codequest.questionservice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "user_question_state")
@IdClass(UserQuestionStateId.class)
public class UserQuestionState {

    @Id
    private String userId;

    @Id
    private String questionId;

    @Id
    private String deviceId;

    private boolean bookmarked;
    private boolean completed;
    private Integer rating;
    private Instant lastPracticedAt;
    private Instant serverUpdatedAt;
    private String notes;

    public UserQuestionState() {}

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public boolean isBookmarked() {
        return bookmarked;
    }

    public void setBookmarked(boolean bookmarked) {
        this.bookmarked = bookmarked;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Instant getLastPracticedAt() {
        return lastPracticedAt;
    }

    public void setLastPracticedAt(Instant lastPracticedAt) {
        this.lastPracticedAt = lastPracticedAt;
    }
    
    public Instant getServerUpdatedAt() {
        return serverUpdatedAt;
    }
    
    public void setServerUpdatedAt(Instant serverUpdatedAt) {
        this.serverUpdatedAt = serverUpdatedAt;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
}
