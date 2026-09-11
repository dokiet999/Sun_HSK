package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.UserExerciseAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserExerciseAttemptRepository extends JpaRepository<UserExerciseAttempt, Long> {

    Page<UserExerciseAttempt> findByUserIdOrderByAttemptedAtDesc(UUID userId, Pageable pageable);

    List<UserExerciseAttempt> findByUserIdAndExerciseId(UUID userId, Long exerciseId);
}
