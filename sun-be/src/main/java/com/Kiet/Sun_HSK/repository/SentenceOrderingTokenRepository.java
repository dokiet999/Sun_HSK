package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.SentenceOrderingToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SentenceOrderingTokenRepository extends JpaRepository<SentenceOrderingToken, Long> {
    List<SentenceOrderingToken> findBySentenceOrderingExerciseIdOrderByPositionAsc(Long sentenceOrderingExerciseId);
}
