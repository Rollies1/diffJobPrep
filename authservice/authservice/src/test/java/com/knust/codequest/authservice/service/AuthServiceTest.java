package com.knust.codequest.authservice.service;

import com.knust.codequest.authservice.config.JwtUtil;
import com.knust.codequest.authservice.dto.AuthResponse;
import com.knust.codequest.authservice.dto.LoginRequest;
import com.knust.codequest.authservice.dto.RegisterRequest;
import com.knust.codequest.authservice.entity.TokenType;
import com.knust.codequest.authservice.entity.User;
import com.knust.codequest.authservice.entity.VerificationToken;
import com.knust.codequest.authservice.exception.BadRequestException;
import com.knust.codequest.authservice.exception.UnauthorizedException;
import com.knust.codequest.authservice.repository.UserRepository;
import com.knust.codequest.authservice.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private MailService mailService;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("Test User");
        user.setEmail("test@example.com");
        user.setPassword("encoded_password");
        user.setRole("USER");
        user.setIsVerified(false);
    }

    @Nested
    class RegisterTests {
        @Test
        void shouldRegisterSuccessfully() {
            RegisterRequest req = new RegisterRequest();
            req.setName("Test User");
            req.setEmail("test@example.com");
            req.setPassword("raw_password");

            when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
            when(passwordEncoder.encode("raw_password")).thenReturn("encoded_password");
            when(userRepository.save(any(User.class))).thenReturn(user);

            AuthResponse response = authService.register(req);

            assertEquals("PENDING_VERIFICATION", response.getToken());
            assertEquals("test@example.com", response.getEmail());
            assertFalse(response.isVerified());

            verify(userRepository).save(any(User.class));
            verify(tokenRepository).save(any(VerificationToken.class));
            verify(mailService).sendVerificationEmail(eq("test@example.com"), anyString());
        }

        @Test
        void shouldThrowWhenEmailExists() {
            RegisterRequest req = new RegisterRequest();
            req.setEmail("test@example.com");

            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

            assertThrows(BadRequestException.class, () -> authService.register(req));
            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    class LoginTests {
        @Test
        void shouldLoginSuccessfullyWhenVerified() {
            user.setIsVerified(true);
            LoginRequest req = new LoginRequest();
            req.setEmail("test@example.com");
            req.setPassword("raw_password");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("raw_password", "encoded_password")).thenReturn(true);
            when(jwtUtil.generateToken("test@example.com", "USER")).thenReturn("jwt_token_here");

            AuthResponse res = authService.login(req);

            assertEquals("jwt_token_here", res.getToken());
            assertTrue(res.isVerified());
        }

        @Test
        void shouldThrowWhenUnverified() {
            LoginRequest req = new LoginRequest();
            req.setEmail("test@example.com");
            req.setPassword("raw_password");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("raw_password", "encoded_password")).thenReturn(true);

            assertThrows(UnauthorizedException.class, () -> authService.login(req));
        }

        @Test
        void shouldThrowOnWrongPassword() {
            LoginRequest req = new LoginRequest();
            req.setEmail("test@example.com");
            req.setPassword("wrong_password");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong_password", "encoded_password")).thenReturn(false);

            assertThrows(UnauthorizedException.class, () -> authService.login(req));
        }
    }

    @Nested
    class VerifyEmailTests {
        @Test
        void shouldVerifySuccessfully() {
            VerificationToken vToken = new VerificationToken("valid-token", user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().plusHours(1));

            when(tokenRepository.findByTokenAndType("valid-token", TokenType.EMAIL_VERIFICATION)).thenReturn(Optional.of(vToken));

            authService.verifyEmail("valid-token");

            assertTrue(user.getIsVerified());
            assertTrue(vToken.getUsed());

            verify(userRepository).save(user);
            verify(tokenRepository).save(vToken);
        }

        @Test
        void shouldThrowOnExpiredToken() {
            VerificationToken vToken = new VerificationToken("expired", user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().minusHours(1));

            when(tokenRepository.findByTokenAndType("expired", TokenType.EMAIL_VERIFICATION)).thenReturn(Optional.of(vToken));

            assertThrows(BadRequestException.class, () -> authService.verifyEmail("expired"));
            verify(userRepository, never()).save(any());
        }

        @Test
        void shouldThrowOnAlreadyUsedToken() {
            VerificationToken vToken = new VerificationToken("used", user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().plusHours(1));
            vToken.setUsed(true);

            when(tokenRepository.findByTokenAndType("used", TokenType.EMAIL_VERIFICATION)).thenReturn(Optional.of(vToken));

            assertThrows(BadRequestException.class, () -> authService.verifyEmail("used"));
            verify(userRepository, never()).save(any());
        }
    }
}
