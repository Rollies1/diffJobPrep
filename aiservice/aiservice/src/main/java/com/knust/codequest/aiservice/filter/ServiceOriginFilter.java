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
 * Validates inter-service requests on INTERNAL paths only.
 * <p>
 * Architecture: the gateway validates the user's JWT and forwards to
 * aiservice with an X-User-Id header (Authorization stripped). User-facing
 * routes (/api/ai/evaluate, /api/ai/chat, etc.) therefore arrive WITHOUT
 * service headers — they're trusted because the gateway already
 * authenticated them.
 * <p>
 * This filter enforces the X-Service-Origin + X-Service-Secret headers ONLY
 * on internal paths (called directly by other services, bypassing the
 * gateway), preventing unauthorized services from triggering expensive LLM
 * calls.
 * <p>
 * Skips validation for actuator/health endpoints.
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

        String path = request.getRequestURI();

        // Skip for actuator + health endpoints.
        if (path.startsWith("/actuator") || path.startsWith("/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Only enforce the service secret on INTERNAL paths (service-to-service,
        // bypassing the gateway). User-facing paths are authenticated by the
        // gateway's JWT filter and forwarded with X-User-Id.
        if (!path.startsWith("/internal")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Internal path — require valid service origin + secret.
        String origin = request.getHeader(ORIGIN_HEADER);
        String secret = request.getHeader(ORIGIN_SECRET);

        if (origin == null || !allowedOrigins.contains(origin)) {
            log.warn("Rejected internal request: invalid or missing X-Service-Origin={}, path={}", origin, path);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Invalid service origin");
            return;
        }

        if (secret == null || !secret.equals(sharedSecret)) {
            log.warn("Rejected internal request: invalid X-Service-Secret from origin={}", origin);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Invalid service secret");
            return;
        }

        log.debug("Allowed internal request from origin={}", origin);
        filterChain.doFilter(request, response);
    }
}
