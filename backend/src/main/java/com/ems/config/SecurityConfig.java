package com.ems.config;

import com.ems.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Login, Refresh, Logout
                .requestMatchers("/api/admin/handbook/**").hasAnyAuthority("HR", "ADMIN") // HR can access handbook mappings
                .requestMatchers("/api/admin/**").hasAnyAuthority("ADMIN", "HR") // Admin and HR
                .requestMatchers("/api/hr/**").hasAnyAuthority("HR", "ADMIN") // HR APIs
                .requestMatchers("/api/manager/**").hasAnyAuthority("PROJECT_MANAGER", "ADMIN", "HR") // Project Manager APIs (and HR/Admin)
                .requestMatchers("/api/it/**").hasAnyAuthority("IT_MANAGER", "ADMIN") // IT Manager APIs
                .requestMatchers("/api/employee/**", "/api/attendance/**", "/api/leaves/**", "/api/permissions/**", "/api/communications/**", "/api/handbook/**", "/api/notifications/**", "/api/departments/**", "/api/designations/**", "/api/roles/**").hasAnyAuthority("EMPLOYEE", "ADMIN", "HR", "PROJECT_MANAGER", "IT_MANAGER") // Core endpoints accessible by everyone
                .anyRequest().authenticated() // All other endpoints require authentication
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*")); // Better for credentialed requests
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
