package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, UUID> {

    @Query(
            "SELECT a FROM AttemptAnswer a JOIN FETCH a.question WHERE a.attempt.id = :attemptId"
    )
    List<AttemptAnswer> findByAttemptId(@Param("attemptId") UUID attemptId);

    Optional<AttemptAnswer> findByAttemptIdAndQuestionId(UUID attemptId, UUID questionId);

    void deleteByAttemptId(UUID attemptId);
}
