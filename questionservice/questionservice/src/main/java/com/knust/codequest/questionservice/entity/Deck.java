package com.knust.codequest.questionservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "decks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deck {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(name = "color_hex")
    private String color;

    @Column(name = "question_count", nullable = false)
    @Builder.Default
    private int questionCount = 0;

}
