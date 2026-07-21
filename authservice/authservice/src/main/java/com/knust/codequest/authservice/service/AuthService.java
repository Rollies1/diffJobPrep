package com.knust.codequest.authservice.service;

import com.knust.codequest.authservice.config.JwtUtil;
import com.knust.codequest.authservice.dto.AuthResponse;
import com.knust.codequest.authservice.dto.ForgotPasswordRequest;
import com.knust.codequest.authservice.dto.LoginRequest;
import com.knust.codequest.authservice.dto.RegisterRequest;
import com.knust.codequest.authservice.dto.ResetPasswordRequest;
import com.knust.codequest.authservice.entity.TokenType;
import com.knust.codequest.authservice.entity.User;
import com.knust.codequest.authservice.entity.VerificationToken;
import com.knust.codequest.authservice.exception.BadRequestException;
import com.knust.codequest.authservice.exception.UnauthorizedException;
import com.knust.codequest.authservice.repository.UserRepository;
import com.knust.codequest.authservice.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final VerificationTokenRepository tokenRepository;
    private final MailService mailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setIsVerified(false);
        userRepository.save(user);

        // Generate verification token
        String tokenStr = UUID.randomUUID().toString();
        VerificationToken vToken = new VerificationToken(tokenStr, user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().plusHours(24));
        tokenRepository.save(vToken);

        // Send email asynchronously
        mailService.sendVerificationEmail(user.getEmail(), tokenStr);

        return new AuthResponse("PENDING_VERIFICATION", user.getName(), user.getEmail(), user.getRole(), false);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new UnauthorizedException("Please verify your email before logging in");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole(), true);
    }

    @Transactional
    public void verifyEmail(String token) {
        VerificationToken vToken = tokenRepository.findByTokenAndType(token, TokenType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new BadRequestException("Invalid or expired token"));

        if (vToken.isExpired()) {
            throw new BadRequestException("Token has expired");
        }

        if (Boolean.TRUE.equals(vToken.getUsed())) {
            throw new BadRequestException("Token has already been used");
        }

        User user = vToken.getUser();
        user.setIsVerified(true);
        userRepository.save(user);

        vToken.setUsed(true);
        tokenRepository.save(vToken);
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("Email is already verified");
        }

        String tokenStr = UUID.randomUUID().toString();
        VerificationToken vToken = new VerificationToken(tokenStr, user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().plusHours(24));
        tokenRepository.save(vToken);

        mailService.sendVerificationEmail(user.getEmail(), tokenStr);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user == null) {
            return; // Silently ignore for security
        }

        String tokenStr = UUID.randomUUID().toString();
        VerificationToken vToken = new VerificationToken(tokenStr, user, TokenType.PASSWORD_RESET, LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(vToken);

        mailService.sendPasswordResetEmail(user.getEmail(), tokenStr);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken vToken = tokenRepository.findByTokenAndType(request.token(), TokenType.PASSWORD_RESET)
                .orElseThrow(() -> new BadRequestException("Invalid or expired token"));

        if (vToken.isExpired()) {
            throw new BadRequestException("Token has expired");
        }

        if (Boolean.TRUE.equals(vToken.getUsed())) {
            throw new BadRequestException("Token has already been used");
        }

        User user = vToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        vToken.setUsed(true);
        tokenRepository.save(vToken);
    }
}