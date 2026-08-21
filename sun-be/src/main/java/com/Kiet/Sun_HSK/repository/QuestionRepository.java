package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findBySectionIdAndDeletedAtIsNullOrderBySortOrder(UUID sectionId);

    List<Question> findBySectionIdInAndDeletedAtIsNull(Collection<UUID> sectionIds);

    Optional<Question> findByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.section.exam.id = :examId AND q.deletedAt IS NULL")
    long countByExamId(UUID examId);

    @Query("SELECT SUM(q.points) FROM Question q WHERE q.section.exam.id = :examId AND q.deletedAt IS NULL")
    Integer sumPointsByExamId(UUID examId);
}
