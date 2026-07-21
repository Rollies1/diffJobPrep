package com.knust.codequest.authservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.authservice.dto.ForgotPasswordRequest;
import com.knust.codequest.authservice.dto.LoginRequest;
import com.knust.codequest.authservice.dto.RegisterRequest;
import com.knust.codequest.authservice.dto.ResetPasswordRequest;
import com.knust.codequest.authservice.entity.TokenType;
import com.knust.codequest.authservice.entity.User;
import com.knust.codequest.authservice.entity.VerificationToken;
import com.knust.codequest.authservice.repository.UserRepository;
import com.knust.codequest.authservice.repository.VerificationTokenRepository;
import com.knust.codequest.authservice.service.MailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
public class AuthIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private MailService mailService;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Nested
    class RegistrationTests {
        @Test
        void shouldRegisterNewUserAndSendVerificationEmail() throws Exception {
            RegisterRequest request = new RegisterRequest();
            request.setName("Test User");
            request.setEmail("test@example.com");
            request.setPassword("password123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("test@example.com"))
                    .andExpect(jsonPath("$.verified").value(false))
                    .andExpect(jsonPath("$.token").value("PENDING_VERIFICATION"));

            User savedUser = userRepository.findByEmail("test@example.com").orElseThrow();
            assertFalse(savedUser.getIsVerified());
            assertTrue(passwordEncoder.matches("password123", savedUser.getPassword()));

            VerificationToken token = tokenRepository.findAll().get(0);
            assertEquals(TokenType.EMAIL_VERIFICATION, token.getType());

            verify(mailService).sendVerificationEmail(eq("test@example.com"), anyString());
        }

        @Test
        void shouldRejectDuplicateEmailRegistration() throws Exception {
            User existing = new User();
            existing.setName("Existing");
            existing.setEmail("test@example.com");
            existing.setPassword("encoded");
            userRepository.save(existing);

            RegisterRequest request = new RegisterRequest();
            request.setName("New");
            request.setEmail("test@example.com");
            request.setPassword("password123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void shouldRejectMissingFieldsRegistration() throws Exception {
            RegisterRequest request = new RegisterRequest();
            // Missing name, email, password

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class LoginTests {
        @Test
        void shouldRejectLoginForUnverifiedUser() throws Exception {
            User unverified = new User();
            unverified.setName("Test");
            unverified.setEmail("unverified@example.com");
            unverified.setPassword(passwordEncoder.encode("password"));
            unverified.setIsVerified(false);
            userRepository.save(unverified);

            LoginRequest request = new LoginRequest();
            request.setEmail("unverified@example.com");
            request.setPassword("password");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void shouldLoginVerifiedUserAndReturnToken() throws Exception {
            User verified = new User();
            verified.setName("Test");
            verified.setEmail("verified@example.com");
            verified.setPassword(passwordEncoder.encode("password"));
            verified.setIsVerified(true);
            userRepository.save(verified);

            LoginRequest request = new LoginRequest();
            request.setEmail("verified@example.com");
            request.setPassword("password");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.verified").value(true));
        }

        @Test
        void shouldRejectInvalidPassword() throws Exception {
            User verified = new User();
            verified.setName("Test");
            verified.setEmail("verified@example.com");
            verified.setPassword(passwordEncoder.encode("password"));
            verified.setIsVerified(true);
            userRepository.save(verified);

            LoginRequest request = new LoginRequest();
            request.setEmail("verified@example.com");
            request.setPassword("wrongpassword");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    class EmailVerificationTests {
        @Test
        void shouldVerifyEmailWithValidToken() throws Exception {
            User user = new User();
            user.setName("Test");
            user.setEmail("verify@example.com");
            user.setPassword("encoded");
            user.setIsVerified(false);
            user = userRepository.save(user);

            VerificationToken token = new VerificationToken("valid-token", user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().plusHours(1));
            tokenRepository.save(token);

            mockMvc.perform(get("/api/auth/verify-email")
                    .param("token", "valid-token"))
                    .andExpect(status().isOk());

            User updatedUser = userRepository.findById(user.getId()).orElseThrow();
            assertTrue(updatedUser.getIsVerified());

            VerificationToken usedToken = tokenRepository.findByToken("valid-token").orElseThrow();
            assertTrue(usedToken.getUsed());
        }

        @Test
        void shouldRejectExpiredToken() throws Exception {
            User user = new User();
            user.setName("Test");
            user.setEmail("verify@example.com");
            user.setPassword("encoded");
            user.setIsVerified(false);
            user = userRepository.save(user);

            VerificationToken token = new VerificationToken("expired-token", user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().minusHours(1));
            tokenRepository.save(token);

            mockMvc.perform(get("/api/auth/verify-email")
                    .param("token", "expired-token"))
                    .andExpect(status().isBadRequest());

            User updatedUser = userRepository.findById(user.getId()).orElseThrow();
            assertFalse(updatedUser.getIsVerified());
        }

        @Test
        void shouldRejectAlreadyUsedToken() throws Exception {
            User user = new User();
            user.setName("Test");
            user.setEmail("verify@example.com");
            user.setPassword("encoded");
            user.setIsVerified(false);
            user = userRepository.save(user);

            VerificationToken token = new VerificationToken("used-token", user, TokenType.EMAIL_VERIFICATION, LocalDateTime.now().plusHours(1));
            token.setUsed(true);
            tokenRepository.save(token);

            mockMvc.perform(get("/api/auth/verify-email")
                    .param("token", "used-token"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void shouldResendVerificationEmail() throws Exception {
            User user = new User();
            user.setName("Test");
            user.setEmail("resend@example.com");
            user.setPassword("encoded");
            user.setIsVerified(false);
            userRepository.save(user);

            mockMvc.perform(post("/api/auth/resend-verification")
                    .param("email", "resend@example.com"))
                    .andExpect(status().isOk());

            verify(mailService).sendVerificationEmail(eq("resend@example.com"), anyString());
        }

        @Test
        void shouldRejectResendForVerifiedEmail() throws Exception {
            User user = new User();
            user.setName("Test");
            user.setEmail("resend@example.com");
            user.setPassword("encoded");
            user.setIsVerified(true);
            userRepository.save(user);

            mockMvc.perform(post("/api/auth/resend-verification")
                    .param("email", "resend@example.com"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class PasswordResetTests {
        @Test
        void shouldCreateResetTokenAndSendEmail() throws Exception {
            User user = new User();
            user.setName("Test");
            user.setEmail("reset@example.com");
            user.setPassword("old-password");
            userRepository.save(user);

            ForgotPasswordRequest request = new ForgotPasswordRequest("reset@example.com");

            mockMvc.perform(post("/api/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            VerificationToken token = tokenRepository.findAll().get(0);
            assertEquals(TokenType.PASSWORD_RESET, token.getType());

            verify(mailService).sendPasswordResetEmail(eq("reset@example.com"), anyString());
        }

        @Test
        void shouldResetPasswordWithValidToken() throws Exception {
            User user = new User();
            user.setName("Test");
            user.setEmail("reset@example.com");
            user.setPassword("old-password");
            user = userRepository.save(user);

            VerificationToken token = new VerificationToken("reset-token", user, TokenType.PASSWORD_RESET, LocalDateTime.now().plusMinutes(15));
            tokenRepository.save(token);

            ResetPasswordRequest request = new ResetPasswordRequest("reset-token", "new-password123");

            mockMvc.perform(post("/api/auth/reset-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            User updatedUser = userRepository.findById(user.getId()).orElseThrow();
            assertTrue(passwordEncoder.matches("new-password123", updatedUser.getPassword()));
            
            VerificationToken usedToken = tokenRepository.findByToken("reset-token").orElseThrow();
            assertTrue(usedToken.getUsed());
        }

        @Test
        void shouldReturn200ForUnknownEmailForgotPassword() throws Exception {
            ForgotPasswordRequest request = new ForgotPasswordRequest("unknown@example.com");

            mockMvc.perform(post("/api/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Should not create a token
            assertTrue(tokenRepository.findAll().isEmpty());
        }
    }
}
