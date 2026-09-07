package com.Kiet.Sun_HSK.configuration;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@FieldDefaults(level = AccessLevel.PRIVATE)
public class    CorsConfig {

    @Value("${app.cors.allowed-origins}")
    String allowedOriginsStr;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Parse danh sách origins từ config (trim khoảng trắng để tránh lỗi cấu hình)
        List<String> origins = Arrays.stream(allowedOriginsStr.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        config.setAllowedOrigins(origins);

        // Cho phép các HTTP methods cần thiết
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers được phép gửi
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "Cache-Control"
        ));

        // Expose Set-Cookie header để client biết cookie được set
        config.setExposedHeaders(List.of("Set-Cookie", "Authorization"));

        // Quan trọng: cho phép credentials (cookie)
        config.setAllowCredentials(true);

        // Cache preflight response trong 1 giờ
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/oauth2/**", config);
        source.registerCorsConfiguration("/login/**", config);

        return source;
    }
}
