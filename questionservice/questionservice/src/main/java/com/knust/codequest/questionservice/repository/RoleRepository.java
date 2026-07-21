package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByNameAndLevel(String name, String level);
}
