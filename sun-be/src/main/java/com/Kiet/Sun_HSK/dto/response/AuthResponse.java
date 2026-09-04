package com.Kiet.Sun_HSK.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthResponse {

    /**
     * JWT Access Token (15 phút) — client lưu trong memory hoặc gửi qua Authorization header.
     * Refresh Token được set tự động qua HttpOnly cookie, không trả về trong body.
     */
    String accessToken;

    String refreshToken;

    @Builder.Default
    String tokenType = "Bearer";

    UserResponse user;
}
