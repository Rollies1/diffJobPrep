package com.group80.cvservice;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Double score;
    private String category;
    private String questionAnswered;
    private LocalDateTime completedAt = LocalDateTime.now();
}