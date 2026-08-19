package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, UUID> {

    List<QuestionOption> findByQuestionIdOrderBySortOrder(UUID questionId);

    /** Bulk load options cho nhiều câu hỏi cùng lúc (tránh N+1 khi chấm bài) */
    List<QuestionOption> findByQuestionIdIn(Collection<UUID> questionIds);

    void deleteByQuestionId(UUID questionId);
}
