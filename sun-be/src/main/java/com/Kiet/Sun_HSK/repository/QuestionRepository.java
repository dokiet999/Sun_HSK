package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findBySectionIdOrderBySortOrder(UUID sectionId);

    List<Question> findBySectionIdIn(Collection<UUID> sectionIds);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.section.exam.id = :examId")
    long countByExamId(UUID examId);

    @Query("SELECT SUM(q.points) FROM Question q WHERE q.section.exam.id = :examId")
    Integer sumPointsByExamId(UUID examId);
}
