package com.knust.codequest.questionservice.repository;

import com.knust.codequest.questionservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.targetRole WHERE u.userId = :userId")
    Optional<User> findWithTargetRole(@Param("userId") UUID userId);
}
