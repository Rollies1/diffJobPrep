package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class RatingRequest {
    @Min(1)
    @Max(5)
    private int rating;

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }
}
