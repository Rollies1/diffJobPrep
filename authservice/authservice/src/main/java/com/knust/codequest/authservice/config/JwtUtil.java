package com.knust.codequest.authservice.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /** Short-lived access token (carries role claim for authz). */
    public String generateToken(String email, String role) {
        return build(email, role, expiration, "access");
    }

    /** Long-lived refresh token (no role claim — only used to mint new access tokens). */
    public String generateRefreshToken(String email) {
        return build(email, null, refreshExpiration, "refresh");
    }

    private String build(String email, String role, long ttlMillis, String type) {
        JwtBuilder builder = Jwts.builder()
                .setSubject(email)
                .claim("type", type)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ttlMillis));
        if (role != null) {
            builder.claim("role", role);
        }
        return builder.signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /** Validate any JWT (access or refresh) — signature + expiry. */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /** True if the token is a refresh token (and valid). */
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return "refresh".equals(claims.get("type", String.class));
        } catch (JwtException e) {
            return false;
        }
    }

    /** Extract the role claim from an access token (null if absent/invalid). */
    public String extractRole(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .get("role", String.class);
        } catch (JwtException e) {
            return null;
        }
    }
}
