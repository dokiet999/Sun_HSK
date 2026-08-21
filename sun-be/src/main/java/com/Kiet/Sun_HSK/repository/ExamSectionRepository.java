package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.ExamSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamSectionRepository extends JpaRepository<ExamSection, UUID> {

    List<ExamSection> findByExamIdAndDeletedAtIsNullOrderBySortOrder(UUID examId);

    Optional<ExamSection> findByIdAndDeletedAtIsNull(UUID id);

    void deleteByExamId(UUID examId);
}
