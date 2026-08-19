package com.Kiet.Sun_HSK.entity;

import com.Kiet.Sun_HSK.enums.AuthProvider;
import com.Kiet.Sun_HSK.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false, unique = true, length = 255)
    String email;

    @Column(unique = true, length = 100)
    String username;

    /**
     * Null khi user đăng ký qua OAuth2.
     */
    @Column(name = "password_hash")
    String passwordHash;

    @Column(name = "display_name")
    String displayName;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "auth_provider", nullable = false, length = 20)
    AuthProvider authProvider = AuthProvider.LOCAL;

    /**
     * Google sub ID — chỉ có khi authProvider = GOOGLE.
     */
    @Column(name = "provider_id")
    String providerId;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    Boolean emailVerified = false;

    @Builder.Default
    @Column(nullable = false)
    Boolean active = true;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // ── Lifecycle callbacks ───────────────────────────────────────────────────

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
