package com.knust.codequest.practiceservice.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DummyController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void handleSessionNotFound_returns404() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void handleIllegalState_returns409() throws Exception {
        mockMvc.perform(get("/test/illegal-state"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict state"));
    }

    @Test
    void handleIllegalArgument_returns400() throws Exception {
        mockMvc.perform(get("/test/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad arg"));
    }

    @Test
    void handleRuntimeException_returns500() throws Exception {
        mockMvc.perform(get("/test/runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Something broke"));
    }

    @RestController
    static class DummyController {
        @GetMapping("/test/not-found")
        public void throwNotFound() {
            throw new SessionNotFoundException(UUID.randomUUID());
        }

        @GetMapping("/test/illegal-state")
        public void throwIllegalState() {
            throw new IllegalStateException("Conflict state");
        }
        
        @GetMapping("/test/illegal-argument")
        public void throwIllegalArgument() {
            throw new IllegalArgumentException("Bad arg");
        }

        @GetMapping("/test/runtime")
        public void throwRuntime() {
            throw new RuntimeException("Something broke");
        }
    }
}
