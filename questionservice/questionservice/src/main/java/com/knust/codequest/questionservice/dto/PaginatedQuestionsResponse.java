package com.knust.codequest.questionservice.dto;

import java.util.List;

public class PaginatedQuestionsResponse {
    private List<QuestionDto> data;
    private String nextCursor;

    public PaginatedQuestionsResponse() {}

    public PaginatedQuestionsResponse(List<QuestionDto> data, String nextCursor) {
        this.data = data;
        this.nextCursor = nextCursor;
    }

    public List<QuestionDto> getData() {
        return data;
    }

    public void setData(List<QuestionDto> data) {
        this.data = data;
    }

    public String getNextCursor() {
        return nextCursor;
    }

    public void setNextCursor(String nextCursor) {
        this.nextCursor = nextCursor;
    }
}
