package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.SentenceOrderingExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SentenceOrderingExerciseRepository extends JpaRepository<SentenceOrderingExercise, Long> {

    Optional<SentenceOrderingExercise> findByExerciseId(Long exerciseId);

    @Query("SELECT s FROM SentenceOrderingExercise s " +
           "LEFT JOIN FETCH s.tokens t " +
           "WHERE s.exercise.id = :exerciseId " +
           "ORDER BY t.position ASC")
    Optional<SentenceOrderingExercise> findByExerciseIdWithTokens(@Param("exerciseId") Long exerciseId);
}
