package com.knust.codequest.questionservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * Optional deck membership. Seeded by V4 for the 700 deck-organised
     * questions; legacy category-only questions have a null deck_id and still
     * work via /api/questions/category/{id}.
     */
    @ManyToOne
    @JoinColumn(name = "deck_id")
    private Deck deck;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String sampleAnswer;

    @Column
    private String difficulty;

    /** Short human-readable title for list views. Added by V4. */
    @Column(length = 200)
    private String title;

    /** Optional nudge shown when a learner is stuck. Added by V4. */
    @Column(columnDefinition = "TEXT")
    private String hint;

    /** Fine-grained sub-topic within the deck (e.g. "Hooks", "Closures"). Added by V4. */
    @Column(name = "sub_topic", length = 120)
    private String subTopic;
}