package com.knust.codequest.questionservice.entity;

import java.io.Serializable;
import java.util.Objects;

public class UserQuestionStateId implements Serializable {
    private String userId;
    private String questionId;
    private String deviceId;

    public UserQuestionStateId() {}

    public UserQuestionStateId(String userId, String questionId, String deviceId) {
        this.userId = userId;
        this.questionId = questionId;
        this.deviceId = deviceId;
    }

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserQuestionStateId that = (UserQuestionStateId) o;
        return Objects.equals(userId, that.userId) &&
               Objects.equals(questionId, that.questionId) &&
               Objects.equals(deviceId, that.deviceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, questionId, deviceId);
    }
}
