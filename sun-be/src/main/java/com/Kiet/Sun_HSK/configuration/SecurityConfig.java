package com.Kiet.Sun_HSK.configuration;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SecurityConfig {

    JwtAuthFilter jwtAuthFilter;
    AuthenticationProvider authenticationProvider;
    OAuth2SuccessHandler oAuth2SuccessHandler;
    CorsConfigurationSource corsConfigurationSource;
    CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    // Dùng constructor injection thủ công để thêm @Lazy vào OAuth2SuccessHandler
    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            AuthenticationProvider authenticationProvider,
            @Lazy OAuth2SuccessHandler oAuth2SuccessHandler,
            CorsConfigurationSource corsConfigurationSource,
            CustomAuthenticationEntryPoint customAuthenticationEntryPoint
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.corsConfigurationSource = corsConfigurationSource;
        this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
    }

    // ── Public endpoints (không cần auth) ─────────────────────────────────────
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/**",
            "/oauth2/**",
            "/login/**",
            "/actuator/health",
            "/actuator/info",
            // Swagger UI (thêm sau khi tích hợp)
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // ── CSRF: tắt vì dùng stateless JWT ──────────────────────────────
                .csrf(AbstractHttpConfigurer::disable)

                // ── CORS: dùng CorsConfig bean ────────────────────────────────────
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // ── Session: STATELESS — không dùng HttpSession ───────────────────
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ── Authorization rules ───────────────────────────────────────────
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()

                        // Vocabulary, Grammar, Exercises GET — ai cũng xem được
                        .requestMatchers(HttpMethod.GET, "/api/v1/vocabulary", "/api/v1/vocabulary/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/exercises", "/api/v1/exercises/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/grammar", "/api/v1/grammar/**").permitAll()

                        // Exam list & detail GET — public (không cần đăng nhập)
                        .requestMatchers(HttpMethod.GET, "/api/v1/exams").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/exams/{id}").permitAll()

                        // Admin only
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/vocabulary/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/vocabulary/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/vocabulary/**").hasRole("ADMIN")
                        .requestMatchers("/actuator/**").hasRole("ADMIN")

                        // Tất cả các request còn lại phải authenticated
                        .anyRequest().authenticated()
                )

                // ── OAuth2 Login ──────────────────────────────────────────────────
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2SuccessHandler)
                        .failureUrl("/api/v1/auth/oauth2/failure")
                )

                // ── Authentication provider ───────────────────────────────────────
                .authenticationProvider(authenticationProvider)

                // ── Custom entry point for unauthorized access ──────────────────
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(customAuthenticationEntryPoint)
                )

                // ── JWT Filter: chạy trước UsernamePasswordAuthenticationFilter ───
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
