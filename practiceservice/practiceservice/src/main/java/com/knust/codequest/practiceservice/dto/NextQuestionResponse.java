package com.knust.codequest.practiceservice.dto;

import java.util.UUID;

/**
 * Response for POST /practice/sessions/{sessionId}/next.
 * Returns the next unanswered question's id + 0-based index, or null if
 * the session is complete (frontend treats null as "no more questions").
 */
public class NextQuestionResponse {

    private UUID questionId;
    private int index;

    public NextQuestionResponse() {}

    public NextQuestionResponse(UUID questionId, int index) {
        this.questionId = questionId;
        this.index = index;
    }

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }
}
