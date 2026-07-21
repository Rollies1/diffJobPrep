package com.knust.codequest.authservice.controller;

import com.knust.codequest.authservice.config.JwtUtil;
import com.knust.codequest.authservice.dto.*;
import com.knust.codequest.authservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login, verification, and password reset")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Create account and send verification email")
    @ApiResponse(responseCode = "200", description = "User registered, verification email sent")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate and return access + refresh JWT tokens")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful"),
            @ApiResponse(responseCode = "400", description = "Invalid credentials"),
            @ApiResponse(responseCode = "403", description = "Email not verified")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Current user", description = "Return the authenticated user's public profile")
    public ResponseEntity<UserDto> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(authService.me(email));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh tokens", description = "Exchange a valid refresh token for a new access + refresh pair")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Stateless logout — client discards tokens")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile")
    @Operation(summary = "Update profile", description = "Update username, name, bio, avatar, onboarding flag")
    public ResponseEntity<UserDto> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(authService.updateProfile(email, request));
    }

    @PutMapping("/password")
    @Operation(summary = "Change password", description = "Change password — requires current password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = emailFromHeader(authHeader);
        authService.changePassword(email, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email", description = "Confirm email address using verification token")
    public ResponseEntity<Void> verifyEmail(@RequestParam @NotBlank String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email", description = "Send a new verification link")
    public ResponseEntity<Void> resendVerification(@RequestParam @NotBlank @Email String email) {
        authService.resendVerificationEmail(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send password reset link to email")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Set new password using reset token")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    // ── helpers ──────────────────────────────────────────────────

    /** Extract the subject (email) from a Bearer token; throws if absent/invalid. */
    private String emailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.knust.codequest.authservice.exception.UnauthorizedException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new com.knust.codequest.authservice.exception.UnauthorizedException("Invalid or expired token");
        }
        return jwtUtil.extractEmail(token);
    }
}
