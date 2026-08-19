package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.request.LoginRequest;
import com.Kiet.Sun_HSK.dto.request.RegisterRequest;
import com.Kiet.Sun_HSK.dto.response.AuthResponse;
import com.Kiet.Sun_HSK.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {

    AuthService authService;

    /**
     * POST /api/v1/auth/register
     * Đăng ký tài khoản mới.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.register(request, response);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công", authResponse));
    }

    /**
     * POST /api/v1/auth/login
     * Đăng nhập bằng email và mật khẩu.
     * Trả về accessToken trong body, refreshToken trong HttpOnly Cookie.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", authResponse));
    }

    /**
     * POST /api/v1/auth/refresh
     * Làm mới Access Token bằng Refresh Token (đọc từ HttpOnly cookie).
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.refreshToken(refreshToken, response);
        return ResponseEntity.ok(ApiResponse.success("Token đã được làm mới", authResponse));
    }

    /**
     * POST /api/v1/auth/logout
     * Đăng xuất — xoá refresh token cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công"));
    }

    /**
     * GET /api/v1/auth/oauth2/failure
     * Callback khi OAuth2 thất bại.
     */
    @GetMapping("/oauth2/failure")
    public ResponseEntity<ApiResponse<Void>> oauth2Failure() {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.<Void>builder()
                        .code(401)
                        .message("Đăng nhập Google thất bại, vui lòng thử lại")
                        .build());
    }
}
