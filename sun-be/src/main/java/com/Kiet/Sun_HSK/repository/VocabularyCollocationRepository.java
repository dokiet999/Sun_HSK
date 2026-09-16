package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.VocabularyCollocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyCollocationRepository extends JpaRepository<VocabularyCollocation, Long> {
    List<VocabularyCollocation> findByVocabularyId(Long vocabularyId);
    void deleteByVocabularyId(Long vocabularyId);
}
