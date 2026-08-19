package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.AuthProvider;
import com.Kiet.Sun_HSK.enums.Role;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {

    UUID id;
    String email;
    String username;
    String displayName;
    String avatarUrl;
    Role role;
    AuthProvider authProvider;
    Boolean emailVerified;
}
