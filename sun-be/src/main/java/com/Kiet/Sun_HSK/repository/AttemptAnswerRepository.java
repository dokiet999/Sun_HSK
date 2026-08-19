package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, UUID> {

    List<AttemptAnswer> findByAttemptId(UUID attemptId);

    Optional<AttemptAnswer> findByAttemptIdAndQuestionId(UUID attemptId, UUID questionId);

    void deleteByAttemptId(UUID attemptId);
}
