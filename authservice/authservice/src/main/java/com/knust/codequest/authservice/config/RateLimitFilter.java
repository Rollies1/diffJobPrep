package com.knust.codequest.authservice.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter for public auth endpoints.
 * <p>
 * Limits per client IP:
 * <ul>
 *   <li>/api/auth/login            — 5 / minute</li>
 *   <li>/api/auth/register          — 3 / minute</li>
 *   <li>/api/auth/forgot-password   — 3 / minute</li>
 *   <li>/api/auth/reset-password    — 3 / minute</li>
 * </ul>
 *
 * Returns 429 Too Many Requests when exceeded. Uses a sliding 1-minute window
 * with a cleanup sweep to evict stale entries. Suitable for single-instance
 * deployments; for multi-instance, swap for a Redis-backed limiter.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;

    private static final Map<String, Integer> LIMITS = Map.of(
            "/api/auth/login", 5,
            "/api/auth/register", 3,
            "/api/auth/forgot-password", 3,
            "/api/auth/reset-password", 3
    );

    // key = "ip:path", value = [count, windowStartMs]
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();
        Integer limit = LIMITS.get(path);

        if (limit != null) {
            String ip = clientIp(request);
            String key = ip + ":" + path;
            Bucket bucket = buckets.compute(key, (k, b) -> {
                long now = System.currentTimeMillis();
                if (b == null || now - b.windowStart > WINDOW_MS) {
                    return new Bucket(1, now);
                }
                b.count.incrementAndGet();
                return b;
            });

            if (bucket.count.get() > limit) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Try again in a minute.");
                response.setHeader("Retry-After", "60");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** Periodic cleanup of stale buckets (called by a scheduled task or lazily). */
    public void evictStale() {
        long now = System.currentTimeMillis();
        buckets.entrySet().removeIf(e -> now - e.getValue().windowStart > WINDOW_MS * 2);
    }

    private static class Bucket {
        final AtomicInteger count;
        final long windowStart;

        Bucket(int initial, long windowStart) {
            this.count = new AtomicInteger(initial);
            this.windowStart = windowStart;
        }
    }
}
