package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.enums.HskVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {

    List<Vocabulary> findByHskLevelOrderBySortOrderAsc(int hskLevel);

    List<Vocabulary> findByHskVersionAndHskLevelOrderBySortOrderAsc(HskVersion hskVersion, int hskLevel);

    List<Vocabulary> findByHskLevelAndDefaultInReviewList(int hskLevel, Boolean defaultInReviewList);

    Optional<Vocabulary> findByHanzi(String hanzi);

    long countByHskLevel(int hskLevel);

    long countByHskVersionAndHskLevel(HskVersion hskVersion, int hskLevel);

    org.springframework.data.domain.Page<Vocabulary> findByHskLevel(int hskLevel, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT DISTINCT v.lessonNumber FROM Vocabulary v " +
           "WHERE (:version IS NULL OR v.hskVersion = :version) AND v.hskLevel = :level AND v.lessonNumber IS NOT NULL " +
           "ORDER BY v.lessonNumber ASC")
    List<Integer> findDistinctLessonNumbersByHskLevelAndHskVersion(
            @Param("level") int level,
            @Param("version") HskVersion version
    );

    default List<Integer> findDistinctLessonNumbersByHskLevel(int level) {
        return findDistinctLessonNumbersByHskLevelAndHskVersion(level, null);
    }

    @Query("SELECT v.id FROM Vocabulary v " +
           "WHERE (:version IS NULL OR v.hskVersion = :version) AND v.hskLevel = :level AND v.lessonNumber = :lessonNumber " +
           "ORDER BY COALESCE(v.position, 0) ASC, v.sortOrder ASC")
    List<Long> findIdsByHskLevelAndLessonNumberAndHskVersion(
            @Param("level") int level,
            @Param("lessonNumber") int lessonNumber,
            @Param("version") HskVersion version
    );

    default List<Long> findIdsByHskLevelAndLessonNumber(int level, int lessonNumber) {
        return findIdsByHskLevelAndLessonNumberAndHskVersion(level, lessonNumber, null);
    }

    @Query("SELECT v.id FROM Vocabulary v " +
           "WHERE (:version IS NULL OR v.hskVersion = :version) AND v.hskLevel = :level " +
           "ORDER BY COALESCE(v.lessonNumber, 0) ASC, COALESCE(v.position, 0) ASC, v.sortOrder ASC")
    List<Long> findIdsByHskLevelAndHskVersion(
            @Param("level") int level,
            @Param("version") HskVersion version
    );

    default List<Long> findIdsByHskLevel(int level) {
        return findIdsByHskLevelAndHskVersion(level, null);
    }

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
           "WHERE (:version IS NULL OR v.hskVersion = :version) AND v.hskLevel = :level " +
           "ORDER BY v.lessonNumber ASC, v.position ASC, v.sortOrder ASC")
    List<Vocabulary> findByHskLevelAndHskVersionWithDetails(
            @Param("level") int level,
            @Param("version") HskVersion version
    );

    default List<Vocabulary> findByHskLevelWithDetails(int level) {
        return findByHskLevelAndHskVersionWithDetails(level, null);
    }

    default List<Vocabulary> findByHskVersionAndHskLevelWithDetails(HskVersion version, int level) {
        return findByHskLevelAndHskVersionWithDetails(level, version);
    }

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
