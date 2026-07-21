package com.knust.codequest.questionservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class DeckCreateRequest {
    @NotBlank
    private String slug;

    @NotBlank
    private String name;

    private String category;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
    private String color;

    private String description;

    private int sortOrder;

    // Getters and Setters
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
