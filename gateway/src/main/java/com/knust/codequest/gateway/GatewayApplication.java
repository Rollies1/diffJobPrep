package com.knust.codequest.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * JobPrep API Gateway.
 *
 * Spring Cloud Gateway (reactive). Routes incoming requests to backend
 * services after JWT validation. Serves Apple/Android deep-link config
 * at /.well-known/* with the correct Content-Type.
 *
 * The gateway does NOT talk to PostgreSQL directly — it is stateless and
 * horizontally scalable. JWTs are validated using a shared HMAC secret.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
