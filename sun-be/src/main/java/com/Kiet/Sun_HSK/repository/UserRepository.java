package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByAuthProviderAndProviderId(
            com.Kiet.Sun_HSK.enums.AuthProvider authProvider,
            String providerId
    );
}
