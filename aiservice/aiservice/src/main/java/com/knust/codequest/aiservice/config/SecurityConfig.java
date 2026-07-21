package com.knust.codequest.aiservice.config;

import com.knust.codequest.aiservice.filter.ServiceOriginFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for aiservice.
 * <p>
 * Validates:
 * <ul>
 *   <li>User JWT via shared jwt.secret</li>
 *   <li>Inter-service identity via X-Service-Origin + X-Service-Secret headers</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ServiceOriginFilter serviceOriginFilter;

    public SecurityConfig(ServiceOriginFilter serviceOriginFilter) {
        this.serviceOriginFilter = serviceOriginFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/actuator/**", "/health").permitAll()
                .requestMatchers("/api/ai/evaluations/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(serviceOriginFilter, UsernamePasswordAuthenticationFilter.class);
        // TODO: Add JwtAuthenticationFilter before ServiceOriginFilter if not already present

        return http.build();
    }
}
