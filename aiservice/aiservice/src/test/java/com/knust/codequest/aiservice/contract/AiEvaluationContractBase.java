package com.knust.codequest.aiservice.contract;

import com.knust.codequest.aiservice.controller.AiEvaluationController;
import com.knust.codequest.aiservice.service.*;
import io.restassured.module.mockmvc.RestAssuredMockMvc;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Base class for Spring Cloud Contract tests.
 * <p>
 * practiceservice uses the generated stubs from this base class
 * to test its WebClient integration without starting the real aiservice.
 */
@WebMvcTest(AiEvaluationController.class)
@ContextConfiguration(classes = {AiEvaluationController.class})
public abstract class AiEvaluationContractBase {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    protected AiEvaluationService aiEvaluationService;

    @MockBean
    protected ReportStorageService reportStorageService;

    @BeforeEach
    void setup() {
        RestAssuredMockMvc.mockMvc(mockMvc);
    }
}
