package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.Exam;
import com.Kiet.Sun_HSK.enums.ExamStatus;
import com.Kiet.Sun_HSK.enums.ExamType;
import com.Kiet.Sun_HSK.enums.HskVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {

    Page<Exam> findByDeletedAtIsNullAndStatus(ExamStatus status, Pageable pageable);

    Page<Exam> findByDeletedAtIsNullAndStatusAndHskVersionAndHskLevel(
            ExamStatus status, HskVersion hskVersion, int hskLevel, Pageable pageable);

    Page<Exam> findByDeletedAtIsNullAndStatusAndExamType(ExamStatus status, ExamType examType, Pageable pageable);

    Optional<Exam> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Exam> findByIdAndDeletedAtIsNullAndStatus(UUID id, ExamStatus status);

    Page<Exam> findByDeletedAtIsNull(Pageable pageable);
}
