package com.knust.codequest.authservice.service;

import com.knust.codequest.authservice.config.JwtUtil;
import com.knust.codequest.authservice.dto.*;
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
        user.setIsPremium(false);
        user.setOnboardingComplete(false);
        // Username: use the provided one, else default to the first name.
        String username = request.getUsername();
        if (username == null || username.isBlank()) {
            username = deriveUsernameFromName(request.getName());
        }
        // Ensure uniqueness — append a number if taken.
        username = ensureUniqueUsername(username);
        user.setUsername(username);
        userRepository.save(user);

        // Generate verification token
        String tokenStr = UUID.randomUUID().toString();
        VerificationToken vToken = new VerificationToken(tokenStr, user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().plusHours(24));
        tokenRepository.save(vToken);

        mailService.sendVerificationEmail(user.getEmail(), tokenStr);

        return buildAuthResponse(user);
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

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserDto me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return UserDto.from(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        String email = jwtUtil.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return buildAuthResponse(user);
    }

    public void logout() {
        // no-op — token invalidation is client-side.
    }

    /** Update the authenticated user's profile (username, name, bio, avatar, onboarding). */
    @Transactional
    public UserDto updateProfile(String email, ProfileUpdateRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (req.getUsername() != null && !req.getUsername().isBlank()
                && !req.getUsername().equals(user.getUsername())) {
            String candidate = ensureUniqueUsername(req.getUsername().trim());
            user.setUsername(candidate);
        }
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName().trim());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl());
        }
        if (req.getOnboardingComplete() != null) {
            user.setOnboardingComplete(req.getOnboardingComplete());
        }
        userRepository.save(user);
        return UserDto.from(user);
    }

    /** Change password — verifies the current password first. */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    // ── verification / reset ─────────────────────────────────────

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

    // ── helpers ──────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String access = jwtUtil.generateToken(user.getEmail(), user.getRole());
        String refresh = jwtUtil.generateRefreshToken(user.getEmail());
        return new AuthResponse(UserDto.from(user), access, refresh);
    }

    /** Derive a lowercase username from the first token of the name. */
    private String deriveUsernameFromName(String name) {
        if (name == null || name.isBlank()) return "user";
        String first = name.trim().split("\\s+")[0].toLowerCase().replaceAll("[^a-z0-9_]", "");
        return first.isEmpty() ? "user" : first;
    }

    /** Append a numeric suffix until the username is unique. */
    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int suffix = 0;
        while (userRepository.findByUsername(candidate).isPresent()) {
            suffix++;
            candidate = base + suffix;
        }
        return candidate;
    }
}
