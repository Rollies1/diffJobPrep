package com.jobprep.gateway.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * JWT configuration and key material.
 *
 * The secret is shared between this gateway (which validates tokens)
 * and whatever service mints them (typically a `authservice` or the
 * `userservice`). In production, rotate this via a secrets manager.
 */
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /** HMAC-SHA256 secret (>= 256 bits). Read from JWT_SECRET env var. */
    private String secret;

    /** Token issuer claim (`iss`). */
    private String issuer;

    /** Paths that bypass JWT validation (deep links, actuator, preflight). */
    private List<String> publicPaths;

    /** Header name used to forward the authenticated user ID downstream. */
    private String userHeader = "X-User-Id";

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }

    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }

    public List<String> getPublicPaths() { return publicPaths; }
    public void setPublicPaths(List<String> publicPaths) { this.publicPaths = publicPaths; }

    public String getUserHeader() { return userHeader; }
    public void setUserHeader(String userHeader) { this.userHeader = userHeader; }

    /**
     * Derive the signing key from the secret string. Cached on first call.
     */
    private volatile SecretKey cachedKey;

    public SecretKey signingKey() {
        if (cachedKey == null) {
            synchronized (this) {
                if (cachedKey == null) {
                    cachedKey = Keys.hmacShaKeyFor(
                        secret.getBytes(StandardCharsets.UTF_8));
                }
            }
        }
        return cachedKey;
    }

    /**
     * Validate and parse a JWT. Throws JwtException on invalid/expired tokens.
     */
    public String parseUserId(String token) {
        return Jwts.parser()
            .verifyWith(signingKey())
            .requireIssuer(issuer)
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
    }
}
