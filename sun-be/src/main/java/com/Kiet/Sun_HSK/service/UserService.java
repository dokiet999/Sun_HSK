package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.response.UserResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.mapper.UserMapper;
import com.Kiet.Sun_HSK.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService implements UserDetailsService {

    UserRepository userRepository;
    UserMapper userMapper;

    // ── UserDetailsService ────────────────────────────────────────────────────

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user: " + email));

        if (!user.getActive()) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                // passwordHash có thể null với OAuth2 user
                .password(user.getPasswordHash() != null ? user.getPasswordHash() : "")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .build();
    }

    // ── Business methods ──────────────────────────────────────────────────────

    public UserResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    public User findByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
