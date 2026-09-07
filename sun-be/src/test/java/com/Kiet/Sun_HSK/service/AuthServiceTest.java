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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    // ── Mocks ──────────────────────────────────────────────────────────────────

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private HttpServletResponse httpServletResponse;

    @InjectMocks
    private AuthService authService;

    // ── Fixtures ───────────────────────────────────────────────────────────────

    private static final String EMAIL = "test@sunhsk.com";
    private static final String PASSWORD = "password123";
    private static final String DISPLAY_NAME = "Test User";
    private static final String ACCESS_TOKEN = "mock.access.token";
    private static final String REFRESH_TOKEN = "mock.refresh.token";

    private User mockUser;
    private UserResponse mockUserResponse;

    @BeforeEach
    void setUp() {
        // Inject @Value field (refreshTokenExpiration = 7 ngày tính bằng ms)
        ReflectionTestUtils.setField(authService, "refreshTokenExpiration", 604800000L);

        mockUser = User.builder()
                .id(UUID.randomUUID())
                .email(EMAIL)
                .displayName(DISPLAY_NAME)
                .passwordHash("encodedPassword")
                .role(Role.USER)
                .authProvider(AuthProvider.LOCAL)
                .emailVerified(false)
                .active(true)
                .build();

        mockUserResponse = UserResponse.builder()
                .id(mockUser.getId())
                .email(EMAIL)
                .displayName(DISPLAY_NAME)
                .role(Role.USER)
                .authProvider(AuthProvider.LOCAL)
                .emailVerified(false)
                .build();
    }

    // ── Stub helper dùng chung cho buildAuthResponse ───────────────────────────

    private void stubJwtAndMapper() {
        when(jwtService.generateAccessToken(any(User.class))).thenReturn(ACCESS_TOKEN);
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn(REFRESH_TOKEN);
        when(userMapper.toUserResponse(any(User.class))).thenReturn(mockUserResponse);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  register()
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("register()")
    class RegisterTests {

        private RegisterRequest buildRequest() {
            RegisterRequest req = new RegisterRequest();
            req.setEmail(EMAIL);
            req.setPassword(PASSWORD);
            req.setDisplayName(DISPLAY_NAME);
            return req;
        }

        @Test
        @DisplayName("Đăng ký thành công → trả về AuthResponse hợp lệ")
        void register_Success() {
            // Arrange
            RegisterRequest request = buildRequest();
            when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
            when(passwordEncoder.encode(PASSWORD)).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(mockUser);
            stubJwtAndMapper();

            // Act
            AuthResponse response = authService.register(request, httpServletResponse);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo(ACCESS_TOKEN);
            assertThat(response.getRefreshToken()).isEqualTo(REFRESH_TOKEN);
            assertThat(response.getUser()).isEqualTo(mockUserResponse);

            verify(userRepository).existsByEmail(EMAIL);
            verify(passwordEncoder).encode(PASSWORD);
            verify(userRepository).save(any(User.class));
            // Cookie header phải được set
            verify(httpServletResponse).addHeader(anyString(), anyString());
        }

        @Test
        @DisplayName("Email đã tồn tại → ném AppException(USER_EXISTED)")
        void register_EmailAlreadyExists_ThrowsUserExistedException() {
            // Arrange
            RegisterRequest request = buildRequest();
            when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.register(request, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.USER_EXISTED);
                    });

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("User được lưu với role USER và authProvider LOCAL")
        void register_SavedUserHasCorrectDefaults() {
            // Arrange
            RegisterRequest request = buildRequest();
            when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
            when(passwordEncoder.encode(PASSWORD)).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            stubJwtAndMapper();

            // Act
            authService.register(request, httpServletResponse);

            // Assert: kiểm tra User được save có đúng fields
            verify(userRepository).save(argThat(user ->
                    user.getEmail().equals(EMAIL) &&
                    user.getDisplayName().equals(DISPLAY_NAME) &&
                    user.getRole() == Role.USER &&
                    user.getAuthProvider() == AuthProvider.LOCAL &&
                    !user.getEmailVerified() &&
                    user.getActive()
            ));
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  login()
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("login()")
    class LoginTests {

        private LoginRequest buildRequest() {
            LoginRequest req = new LoginRequest();
            req.setEmail(EMAIL);
            req.setPassword(PASSWORD);
            return req;
        }

        @Test
        @DisplayName("Đăng nhập thành công → trả về AuthResponse hợp lệ")
        void login_Success() {
            // Arrange
            LoginRequest request = buildRequest();
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(null); // không ném exception = xác thực thành công
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(mockUser));
            stubJwtAndMapper();

            // Act
            AuthResponse response = authService.login(request, httpServletResponse);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo(ACCESS_TOKEN);
            assertThat(response.getRefreshToken()).isEqualTo(REFRESH_TOKEN);
            assertThat(response.getUser()).isEqualTo(mockUserResponse);

            verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
            verify(userRepository).findByEmail(EMAIL);
            verify(httpServletResponse).addHeader(anyString(), anyString());
        }

        @Test
        @DisplayName("Sai mật khẩu → ném AppException(INVALID_CREDENTIALS)")
        void login_BadCredentials_ThrowsInvalidCredentialsException() {
            // Arrange
            LoginRequest request = buildRequest();
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(request, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
                    });

            verify(userRepository, never()).findByEmail(anyString());
        }

        @Test
        @DisplayName("Authenticate thành công nhưng user không tồn tại trong DB → ném AppException(USER_NOT_FOUND)")
        void login_UserNotFoundAfterAuthentication_ThrowsUserNotFoundException() {
            // Arrange
            LoginRequest request = buildRequest();
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(null);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.login(request, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);
                    });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  refreshToken()
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("refreshToken()")
    class RefreshTokenTests {

        @Test
        @DisplayName("Refresh token hợp lệ → trả về AuthResponse mới")
        void refreshToken_ValidToken_ReturnsNewAuthResponse() {
            // Arrange
            when(jwtService.validateToken(REFRESH_TOKEN)).thenReturn(true);
            when(jwtService.extractTokenType(REFRESH_TOKEN)).thenReturn("refresh");
            when(jwtService.extractEmail(REFRESH_TOKEN)).thenReturn(EMAIL);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(mockUser));
            stubJwtAndMapper();

            // Act
            AuthResponse response = authService.refreshToken(REFRESH_TOKEN, httpServletResponse);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo(ACCESS_TOKEN);
            assertThat(response.getRefreshToken()).isEqualTo(REFRESH_TOKEN);
        }

        @Test
        @DisplayName("Token null → ném AppException(REFRESH_TOKEN_MISSING)")
        void refreshToken_NullToken_ThrowsRefreshTokenMissingException() {
            assertThatThrownBy(() -> authService.refreshToken(null, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.REFRESH_TOKEN_MISSING);
                    });
        }

        @Test
        @DisplayName("Token rỗng → ném AppException(REFRESH_TOKEN_MISSING)")
        void refreshToken_BlankToken_ThrowsRefreshTokenMissingException() {
            assertThatThrownBy(() -> authService.refreshToken("   ", httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.REFRESH_TOKEN_MISSING);
                    });
        }

        @Test
        @DisplayName("Token chữ ký không hợp lệ → ném AppException(INVALID_TOKEN)")
        void refreshToken_InvalidSignature_ThrowsInvalidTokenException() {
            // Arrange
            when(jwtService.validateToken(REFRESH_TOKEN)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(REFRESH_TOKEN, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_TOKEN);
                    });
        }

        @Test
        @DisplayName("Gửi access token thay vì refresh token → ném AppException(INVALID_TOKEN)")
        void refreshToken_AccessTokenUsed_ThrowsInvalidTokenException() {
            // Arrange
            when(jwtService.validateToken(REFRESH_TOKEN)).thenReturn(true);
            when(jwtService.extractTokenType(REFRESH_TOKEN)).thenReturn("access"); // sai type

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(REFRESH_TOKEN, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_TOKEN);
                    });
        }

        @Test
        @DisplayName("Email trong token không tồn tại trong DB → ném AppException(USER_NOT_FOUND)")
        void refreshToken_UserNotFound_ThrowsUserNotFoundException() {
            // Arrange
            when(jwtService.validateToken(REFRESH_TOKEN)).thenReturn(true);
            when(jwtService.extractTokenType(REFRESH_TOKEN)).thenReturn("refresh");
            when(jwtService.extractEmail(REFRESH_TOKEN)).thenReturn(EMAIL);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(REFRESH_TOKEN, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);
                    });
        }

        @Test
        @DisplayName("Tài khoản bị vô hiệu hóa → ném AppException(ACCOUNT_DISABLED)")
        void refreshToken_InactiveAccount_ThrowsAccountDisabledException() {
            // Arrange
            User inactiveUser = User.builder()
                    .id(UUID.randomUUID())
                    .email(EMAIL)
                    .active(false)
                    .build();

            when(jwtService.validateToken(REFRESH_TOKEN)).thenReturn(true);
            when(jwtService.extractTokenType(REFRESH_TOKEN)).thenReturn("refresh");
            when(jwtService.extractEmail(REFRESH_TOKEN)).thenReturn(EMAIL);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(inactiveUser));

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(REFRESH_TOKEN, httpServletResponse))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_DISABLED);
                    });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  logout()
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("logout()")
    class LogoutTests {

        @Test
        @DisplayName("Logout thành công → Set-Cookie header được thêm vào response")
        void logout_Success_ClearsCookie() {
            // Act
            authService.logout(httpServletResponse);

            // Assert: header Set-Cookie phải được gọi với maxAge=0 (xóa cookie)
            verify(httpServletResponse).addHeader(
                    eq("Set-Cookie"),
                    argThat(cookieValue ->
                            cookieValue.contains("refreshToken=") &&
                            cookieValue.contains("Max-Age=0")
                    )
            );
        }

        @Test
        @DisplayName("Logout không ném exception")
        void logout_DoesNotThrow() {
            // Act & Assert: không ném bất kỳ exception nào
            org.junit.jupiter.api.Assertions.assertDoesNotThrow(
                    () -> authService.logout(httpServletResponse)
            );
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  processOAuth2User()
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("processOAuth2User()")
    class ProcessOAuth2UserTests {

        private static final String AVATAR_URL = "https://example.com/avatar.jpg";
        private static final String PROVIDER_ID = "google-sub-12345";

        @Test
        @DisplayName("User chưa tồn tại → tạo mới và lưu DB")
        void processOAuth2User_NewUser_CreatesAndSaves() {
            // Arrange
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            User result = authService.processOAuth2User(
                    EMAIL, DISPLAY_NAME, AVATAR_URL, AuthProvider.GOOGLE, PROVIDER_ID
            );

            // Assert
            assertThat(result.getEmail()).isEqualTo(EMAIL);
            assertThat(result.getDisplayName()).isEqualTo(DISPLAY_NAME);
            assertThat(result.getAvatarUrl()).isEqualTo(AVATAR_URL);
            assertThat(result.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);
            assertThat(result.getProviderId()).isEqualTo(PROVIDER_ID);
            assertThat(result.getEmailVerified()).isTrue();
            assertThat(result.getActive()).isTrue();
            assertThat(result.getRole()).isEqualTo(Role.USER);

            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("User đã tồn tại → cập nhật thông tin và lưu lại")
        void processOAuth2User_ExistingUser_UpdatesAndSaves() {
            // Arrange
            User existingUser = User.builder()
                    .id(UUID.randomUUID())
                    .email(EMAIL)
                    .displayName("Old Name")
                    .avatarUrl("https://old-avatar.com")
                    .emailVerified(false)
                    .providerId(null) // chưa có providerId
                    .authProvider(AuthProvider.LOCAL)
                    .active(true)
                    .build();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            User result = authService.processOAuth2User(
                    EMAIL, DISPLAY_NAME, AVATAR_URL, AuthProvider.GOOGLE, PROVIDER_ID
            );

            // Assert: thông tin được cập nhật
            assertThat(result.getDisplayName()).isEqualTo(DISPLAY_NAME);
            assertThat(result.getAvatarUrl()).isEqualTo(AVATAR_URL);
            assertThat(result.getEmailVerified()).isTrue();
            // providerId được set khi chưa có
            assertThat(result.getProviderId()).isEqualTo(PROVIDER_ID);
            assertThat(result.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);

            verify(userRepository).save(existingUser);
        }

        @Test
        @DisplayName("User đã có providerId → không ghi đè providerId và authProvider")
        void processOAuth2User_ExistingUserWithProviderId_DoesNotOverwriteProvider() {
            // Arrange
            String existingProviderId = "existing-provider-id";
            User existingUser = User.builder()
                    .id(UUID.randomUUID())
                    .email(EMAIL)
                    .displayName("Old Name")
                    .emailVerified(false)
                    .providerId(existingProviderId) // đã có providerId
                    .authProvider(AuthProvider.GOOGLE)
                    .active(true)
                    .build();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            authService.processOAuth2User(
                    EMAIL, DISPLAY_NAME, AVATAR_URL, AuthProvider.GOOGLE, "new-provider-id"
            );

            // Assert: providerId cũ không bị ghi đè
            assertThat(existingUser.getProviderId()).isEqualTo(existingProviderId);
        }
    }
}
