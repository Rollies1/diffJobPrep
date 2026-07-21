package com.knust.codequest.aiservice.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Validates inter-service requests via X-Service-Origin header.
 * <p>
 * Prevents unauthorized services (or leaked user tokens) from triggering
 * expensive LLM calls. Complements JWT user authentication.
 * <p>
 * Skips validation for actuator and public health endpoints.
 */
@Component
@Order(1)
public class ServiceOriginFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ServiceOriginFilter.class);
    private static final String ORIGIN_HEADER = "X-Service-Origin";
    private static final String ORIGIN_SECRET = "X-Service-Secret";

    private final Set<String> allowedOrigins;
    private final String sharedSecret;

    public ServiceOriginFilter(
            @Value("${ai.service.allowed-origins:practiceservice,notificationservice}") String allowedOrigins,
            @Value("${ai.service.shared-secret:change-me-in-production}") String sharedSecret) {
        this.allowedOrigins = Set.of(allowedOrigins.split(","));
        this.sharedSecret = sharedSecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String origin = request.getHeader(ORIGIN_HEADER);
        String secret = request.getHeader(ORIGIN_SECRET);

        // Skip for actuator and public endpoints
        String path = request.getRequestURI();
        if (path.startsWith("/actuator") || path.startsWith("/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (origin == null || !allowedOrigins.contains(origin)) {
            log.warn("Rejected request: invalid or missing X-Service-Origin={}, path={}", origin, path);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Invalid service origin");
            return;
        }

        if (secret == null || !secret.equals(sharedSecret)) {
            log.warn("Rejected request: invalid X-Service-Secret from origin={}", origin);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Invalid service secret");
            return;
        }

        log.debug("Allowed inter-service request from origin={}", origin);
        filterChain.doFilter(request, response);
    }
}
