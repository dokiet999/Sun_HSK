package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.FillBlankExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FillBlankExerciseRepository extends JpaRepository<FillBlankExercise, Long> {
    Optional<FillBlankExercise> findByExerciseId(Long exerciseId);
}
