package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.VocabularyExample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyExampleRepository extends JpaRepository<VocabularyExample, Long> {
    List<VocabularyExample> findByVocabularyIdOrderBySortOrderAsc(Long vocabularyId);
    void deleteByVocabularyId(Long vocabularyId);
}
