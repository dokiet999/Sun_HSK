package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {

    List<Vocabulary> findByHskLevelOrderBySortOrderAsc(int hskLevel);

    List<Vocabulary> findByHskLevelAndDefaultInReviewList(int hskLevel, Boolean defaultInReviewList);

    Optional<Vocabulary> findByHanzi(String hanzi);

    long countByHskLevel(int hskLevel);

    org.springframework.data.domain.Page<Vocabulary> findByHskLevel(int hskLevel, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT DISTINCT v.lessonNumber FROM Vocabulary v WHERE v.hskLevel = :level AND v.lessonNumber IS NOT NULL ORDER BY v.lessonNumber ASC")
    List<Integer> findDistinctLessonNumbersByHskLevel(@Param("level") int level);

    @Query("SELECT v.id FROM Vocabulary v WHERE v.hskLevel = :level AND v.lessonNumber = :lessonNumber ORDER BY COALESCE(v.position, 0) ASC, v.sortOrder ASC")
    List<Long> findIdsByHskLevelAndLessonNumber(@Param("level") int level, @Param("lessonNumber") int lessonNumber);

    @Query("SELECT v.id FROM Vocabulary v WHERE v.hskLevel = :level ORDER BY COALESCE(v.lessonNumber, 0) ASC, COALESCE(v.position, 0) ASC, v.sortOrder ASC")
    List<Long> findIdsByHskLevel(@Param("level") int level);

    @Query("SELECT DISTINCT v FROM Vocabulary v " +
           "LEFT JOIN FETCH v.collocations " +
           "LEFT JOIN FETCH v.examples " +
           "WHERE v.id IN :ids " +
           "ORDER BY v.lessonNumber ASC, v.position ASC, v.sortOrder ASC")
    List<Vocabulary> findByIdsWithDetails(@Param("ids") List<Long> ids);

    @Query("SELECT DISTINCT v FROM Vocabulary v " +
           "LEFT JOIN FETCH v.collocations " +
           "LEFT JOIN FETCH v.examples " +
           "WHERE v.id = :id")
    Optional<Vocabulary> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT v FROM Vocabulary v " +
           "LEFT JOIN FETCH v.collocations " +
           "LEFT JOIN FETCH v.examples " +
           "WHERE v.hskLevel = :level " +
           "ORDER BY v.lessonNumber ASC, v.position ASC, v.sortOrder ASC")
    List<Vocabulary> findByHskLevelWithDetails(@Param("level") int level);

    @Query("SELECT COALESCE(MAX(v.id), 0) FROM Vocabulary v")
    Long findMaxId();

    @Query("SELECT v.hskLevel, COUNT(v) FROM Vocabulary v GROUP BY v.hskLevel ORDER BY v.hskLevel ASC")
    List<Object[]> countGroupByHskLevel();

    @Query(value = "SELECT v FROM Vocabulary v WHERE (:level IS NULL OR v.hskLevel = :level) " +
           "AND (:lesson IS NULL OR v.lessonNumber = :lesson) " +
           "AND (:keyword IS NULL OR :keyword = '' OR " +
           "     LOWER(v.hanzi) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(v.pinyin) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(v.meaningVi) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(v.hanViet) LIKE LOWER(CONCAT('%', :keyword, '%')))",
           countQuery = "SELECT COUNT(v) FROM Vocabulary v WHERE (:level IS NULL OR v.hskLevel = :level) " +
           "AND (:lesson IS NULL OR v.lessonNumber = :lesson) " +
           "AND (:keyword IS NULL OR :keyword = '' OR " +
           "     LOWER(v.hanzi) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(v.pinyin) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(v.meaningVi) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(v.hanViet) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    org.springframework.data.domain.Page<Vocabulary> searchAdmin(
            @Param("level") Integer level,
            @Param("lesson") Integer lesson,
            @Param("keyword") String keyword,
            org.springframework.data.domain.Pageable pageable
    );
}
