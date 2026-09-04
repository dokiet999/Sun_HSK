package com.Kiet.Sun_HSK.configuration;

import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.enums.AuthProvider;
import com.Kiet.Sun_HSK.service.AuthService;
import com.Kiet.Sun_HSK.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    final AuthService authService;
    final JwtService jwtService;

    @Value("${app.frontend-url}")
    String frontendUrl;

    @Value("${app.jwt.refresh-token-expiration}")
    long refreshTokenExpiration;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                         HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // Trích xuất thông tin từ Google OAuth2 attributes
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String sub = oAuth2User.getAttribute("sub"); // Google unique ID

        log.info("OAuth2 login success: email={}, provider=GOOGLE", email);

        // Upsert user trong database
        User user = authService.processOAuth2User(email, name, picture, AuthProvider.GOOGLE, sub);

        // Tạo tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Set Refresh Token vào HttpOnly Cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // TODO: true trên production HTTPS
                .path("/")
                .maxAge(Duration.ofMillis(refreshTokenExpiration))
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // Redirect về frontend với accessToken trong URL fragment
        // Frontend sẽ đọc fragment này và lưu vào memory
        String redirectUrl = frontendUrl + "/oauth2/callback#token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
