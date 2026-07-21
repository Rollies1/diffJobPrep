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
 * Architecture: the gateway validates the user's JWT and forwards to
 * aiservice with an X-User-Id header (Authorization stripped). aiservice
 * trusts the gateway for user-facing routes. The {@link ServiceOriginFilter}
 * enforces the inter-service shared secret only on /internal/** paths.
 * <p>
 * No separate JwtAuthenticationFilter is needed because JWT validation is
 * the gateway's responsibility — aiservice is not directly exposed (it runs
 * on port 8084 behind the gateway on 8089).
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
                // User-facing routes: trusted (gateway already validated JWT).
                .requestMatchers("/api/ai/**").permitAll()
                // Internal routes: enforced by ServiceOriginFilter.
                .requestMatchers("/internal/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(serviceOriginFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
