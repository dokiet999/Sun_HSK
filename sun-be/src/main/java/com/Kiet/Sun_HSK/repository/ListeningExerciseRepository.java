package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.ListeningExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ListeningExerciseRepository extends JpaRepository<ListeningExercise, Long> {
    Optional<ListeningExercise> findByExerciseId(Long exerciseId);
}
