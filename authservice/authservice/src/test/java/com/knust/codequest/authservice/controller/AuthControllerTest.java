package com.knust.codequest.authservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.authservice.dto.AuthResponse;
import com.knust.codequest.authservice.dto.LoginRequest;
import com.knust.codequest.authservice.dto.RegisterRequest;
import com.knust.codequest.authservice.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for pure web slice tests
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Nested
    @DisplayName("POST /api/auth/register")
    class RegisterEndpoints {
        
        @Test
        void shouldReturn200OnValidRegistration() throws Exception {
            RegisterRequest req = new RegisterRequest();
            req.setName("Test");
            req.setEmail("test@test.com");
            req.setPassword("password");

            AuthResponse mockRes = new AuthResponse("PENDING", "Test", "test@test.com", "USER", false);
            when(authService.register(any(RegisterRequest.class))).thenReturn(mockRes);

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpoints {

        @Test
        void shouldReturn200OnValidLogin() throws Exception {
            LoginRequest req = new LoginRequest();
            req.setEmail("test@test.com");
            req.setPassword("password");

            AuthResponse mockRes = new AuthResponse("JWT_TOKEN", "Test", "test@test.com", "USER", true);
            when(authService.login(any(LoginRequest.class))).thenReturn(mockRes);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("JWT_TOKEN"));
        }
    }
}
