package com.knust.codequest.questionservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Integer roleId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String level;

    @ManyToMany(mappedBy = "roles")
    private Set<Question> questions = new HashSet<>();

    @OneToMany(mappedBy = "targetRole")
    private Set<User> users = new HashSet<>();

    public Role(String name, String level) {
        this.name = name;
        this.level = level;
    }
}
