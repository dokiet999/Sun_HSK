package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.ExamAttempt;
import com.Kiet.Sun_HSK.enums.AttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    Optional<ExamAttempt> findByIdAndUserId(UUID id, UUID userId);

    Page<ExamAttempt> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    boolean existsByUserIdAndExamIdAndStatus(UUID userId, UUID examId, AttemptStatus status);

    /** Điểm cao nhất của user trên một đề thi */
    Optional<ExamAttempt> findTopByUserIdAndExamIdAndStatusOrderByTotalScoreDesc(
            UUID userId, UUID examId, AttemptStatus status);
}
