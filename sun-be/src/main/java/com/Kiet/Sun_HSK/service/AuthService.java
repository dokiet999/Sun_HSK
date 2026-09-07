package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.LoginRequest;
import com.Kiet.Sun_HSK.dto.request.RegisterRequest;
import com.Kiet.Sun_HSK.dto.response.AuthResponse;
import com.Kiet.Sun_HSK.dto.response.UserResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.enums.AuthProvider;
import com.Kiet.Sun_HSK.enums.Role;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.mapper.UserMapper;
import com.Kiet.Sun_HSK.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthService {

    final UserRepository userRepository;
    final UserMapper userMapper;
    final PasswordEncoder passwordEncoder;
    final AuthenticationManager authenticationManager;
    final JwtService jwtService;

    @Value("${app.jwt.refresh-token-expiration}")
    long refreshTokenExpiration;

    @Value("${app.cookie.secure:false}")
    boolean cookieSecure = false;

    @Value("${app.cookie.same-site:Lax}")
    String cookieSameSite = "Lax";

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(Role.USER)
                .authProvider(AuthProvider.LOCAL)
                .emailVerified(false)
                .active(true)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        return buildAuthResponse(user, response);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, response);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────

    public AuthResponse refreshToken(String refreshToken, HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_MISSING);
        }

        if (!jwtService.validateToken(refreshToken)) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        // Đảm bảo đây là refresh token, không phải access token
        String tokenType = jwtService.extractTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.getActive()) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }

        return buildAuthResponse(user, response);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    public void logout(HttpServletResponse response) {
        // Xoá refresh token cookie bằng cách set maxAge = 0
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        log.debug("Refresh token cookie cleared");
    }

    // ── OAuth2 user processing ────────────────────────────────────────────────

    @Transactional
    public User processOAuth2User(String email, String displayName, String avatarUrl,
                                   AuthProvider provider, String providerId) {
        // Tìm user theo email trước (user đã có thể đăng ký local)
        return userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Cập nhật thông tin từ OAuth2 nếu cần
                    existingUser.setDisplayName(displayName);
                    existingUser.setAvatarUrl(avatarUrl);
                    existingUser.setEmailVerified(true);
                    if (existingUser.getProviderId() == null) {
                        existingUser.setProviderId(providerId);
                        existingUser.setAuthProvider(provider);
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Tạo mới user từ OAuth2
                    User newUser = User.builder()
                            .email(email)
                            .displayName(displayName)
                            .avatarUrl(avatarUrl)
                            .role(Role.USER)
                            .authProvider(provider)
                            .providerId(providerId)
                            .emailVerified(true)
                            .active(true)
                            .build();
                    log.info("New OAuth2 user created: {} ({})", email, provider);
                    return userRepository.save(newUser);
                });
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Set Refresh Token vào HttpOnly Cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(Duration.ofMillis(refreshTokenExpiration))
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        UserResponse userResponse = userMapper.toUserResponse(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userResponse)
                .build();
    }
}
