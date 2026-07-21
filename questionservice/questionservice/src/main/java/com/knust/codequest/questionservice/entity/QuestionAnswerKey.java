package com.knust.codequest.questionservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "question_answer_keys")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAnswerKey {

    @Id
    private String questionId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String options; // JSON array for multiple choice

    @Column(columnDefinition = "TEXT")
    private String explanation; // Why this answer is correct
}
