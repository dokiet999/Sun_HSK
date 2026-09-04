package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.ExamAttempt;
import com.Kiet.Sun_HSK.enums.AttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    @Query(
            "SELECT a FROM ExamAttempt a JOIN FETCH a.exam WHERE a.id = :id AND a.user.id = :userId"
    )
    Optional<ExamAttempt> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query(
            value = "SELECT a FROM ExamAttempt a JOIN FETCH a.exam WHERE a.user.id = :userId ORDER BY a.startedAt DESC",
            countQuery = "SELECT count(a) FROM ExamAttempt a WHERE a.user.id = :userId"
    )
    Page<ExamAttempt> findByUserIdOrderByStartedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    boolean existsByUserIdAndExamIdAndStatus(UUID userId, UUID examId, AttemptStatus status);

    /** Điểm cao nhất của user trên một đề thi */
    Optional<ExamAttempt> findTopByUserIdAndExamIdAndStatusOrderByTotalScoreDesc(
            UUID userId, UUID examId, AttemptStatus status);
}
