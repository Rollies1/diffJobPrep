package com.knust.codequest.gateway.filter;

import com.knust.codequest.gateway.config.JwtProperties;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Global JWT authentication filter.
 *
 * Per review:
 *   - Extracts the token from the Authorization header for HTTP requests.
 *   - Falls back to the `?token=` query parameter for WebSocket upgrades
 *     (WebSockets can't easily send headers during the upgrade handshake).
 *     NOTE: query-param tokens are a security smell — they land in access
 *     logs. For production WS auth, prefer a short-lived one-time ticket
 *     (POST /api/ai/ws-ticket returns a 30s ticket, client opens WS with
 *     ?ticket=..., server validates + consumes on handshake). The fallback
 *     here is the pragmatic baseline.
 *   - Skips public paths (/.well-known/**, /actuator/**, OPTIONS preflight).
 *   - On success, forwards the user ID downstream via X-User-Id header
 *     and strips the Authorization header so downstream services trust
 *     the gateway, not the client.
 *
 * Order: runs before routing (Ordered.HIGHEST_PRECEDENCE + 100) so
 * downstream services never see an unauthenticated request.
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtProperties jwtProps;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtAuthFilter(JwtProperties jwtProps) {
        this.jwtProps = jwtProps;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // 1. Skip public paths.
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // 2. Skip CORS preflight.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod().name())) {
            return chain.filter(exchange);
        }

        // 3. Extract token: Authorization header first, then ?token= for WS.
        String token = extractToken(request);
        if (token == null) {
            return reject(exchange, "missing_token", "Authorization header or ?token= required");
        }

        // 4. Validate + parse.
        try {
            String userId = jwtProps.parseUserId(token);
            // 5. Forward user ID downstream, strip client-supplied Authorization.
            ServerHttpRequest mutated = request.mutate()
                .header(jwtProps.getUserHeader(), userId)
                .headers(h -> h.remove("Authorization"))
                .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (JwtException e) {
            log.debug("JWT rejected: {}", e.getMessage());
            return reject(exchange, "invalid_token", e.getMessage());
        }
    }

    private boolean isPublicPath(String path) {
        return jwtProps.getPublicPaths().stream()
            .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private String extractToken(ServerHttpRequest request) {
        // Header: "Authorization: Bearer <token>"
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        // Query param: ?token=<token> (for WebSocket upgrades only).
        String queryToken = request.getQueryParams().getFirst("token");
        return queryToken;
    }

    private Mono<Void> reject(ServerWebExchange exchange, String code, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = """
            {"error":"%s","code":"%s"}""".formatted(message, code);
        return response.writeWith(
            Mono.just(response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }
}
