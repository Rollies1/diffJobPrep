package com.knust.codequest.authservice.repository;

import com.knust.codequest.authservice.entity.TokenType;
import com.knust.codequest.authservice.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByTokenAndType(String token, TokenType type);

    Optional<VerificationToken> findByToken(String token);
}
