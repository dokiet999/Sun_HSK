package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.Exercise;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    List<Exercise> findByHskLevelAndExerciseType(int hskLevel, ExerciseType exerciseType);

    List<Exercise> findByHskLevel(int hskLevel);

    List<Exercise> findByVocabularyId(Long vocabularyId);

    List<Exercise> findByExampleId(Long exampleId);

    void deleteByVocabularyId(Long vocabularyId);

    @Query("SELECT e FROM Exercise e " +
           "JOIN FETCH e.vocabulary v " +
           "LEFT JOIN FETCH e.example ex " +
           "WHERE e.hskLevel = :level AND e.exerciseType = :type")
    List<Exercise> findByLevelAndTypeWithDetails(@Param("level") int level, @Param("type") ExerciseType type);

    @Query("SELECT e FROM Exercise e " +
           "JOIN FETCH e.vocabulary v " +
           "LEFT JOIN FETCH e.example ex " +
           "WHERE e.vocabulary.id IN :vocabIds AND e.exerciseType = :type")
    List<Exercise> findByVocabularyIdInAndExerciseTypeWithDetails(@Param("vocabIds") List<Long> vocabIds, @Param("type") ExerciseType type);
}
