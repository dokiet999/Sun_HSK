package com.Kiet.Sun_HSK.repository;

import com.Kiet.Sun_HSK.entity.UserVocabulary;
import com.Kiet.Sun_HSK.enums.HskVersion;
import com.Kiet.Sun_HSK.enums.VocabularyLearningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVocabularyRepository extends JpaRepository<UserVocabulary, Long> {

    Optional<UserVocabulary> findByUserIdAndVocabularyId(UUID userId, Long vocabularyId);

    List<UserVocabulary> findByUserIdAndStatus(UUID userId, VocabularyLearningStatus status);

    List<UserVocabulary> findByUserIdAndInReviewList(UUID userId, Boolean inReviewList);

    @Query("SELECT uv FROM UserVocabulary uv " +
           "JOIN FETCH uv.vocabulary v " +
           "WHERE uv.user.id = :userId AND uv.inReviewList = true AND v.hskLevel = :level")
    List<UserVocabulary> findByUserIdAndInReviewListAndLevel(@Param("userId") UUID userId, @Param("level") int level);

    @Query("SELECT uv FROM UserVocabulary uv " +
           "JOIN FETCH uv.vocabulary v " +
           "WHERE uv.user.id = :userId AND uv.nextReviewAt <= :now " +
           "ORDER BY uv.nextReviewAt ASC")
    List<UserVocabulary> findDueForReview(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    long countByUserIdAndStatus(UUID userId, VocabularyLearningStatus status);

    @Query("SELECT uv.status, COUNT(uv) FROM UserVocabulary uv " +
           "JOIN uv.vocabulary v " +
           "WHERE uv.user.id = :userId AND v.hskLevel = :level " +
           "GROUP BY uv.status")
    List<Object[]> countStatusByUserIdAndLevel(@Param("userId") UUID userId, @Param("level") int level);

    @Query("SELECT uv.vocabulary.id, uv.status FROM UserVocabulary uv " +
           "JOIN uv.vocabulary v " +
           "WHERE uv.user.id = :userId AND v.hskLevel = :level AND (:version IS NULL OR v.hskVersion = :version)")
    List<Object[]> findStatusMapByUserIdAndLevelAndVersion(
            @Param("userId") UUID userId,
            @Param("level") int level,
            @Param("version") HskVersion version
    );

    default List<Object[]> findStatusMapByUserIdAndLevel(UUID userId, int level) {
        return findStatusMapByUserIdAndLevelAndVersion(userId, level, null);
    }

    @Query("SELECT uv FROM UserVocabulary uv " +
           "WHERE uv.user.id = :userId AND uv.vocabulary.id IN :vocabIds")
    List<UserVocabulary> findByUserIdAndVocabularyIdIn(@Param("userId") UUID userId, @Param("vocabIds") List<Long> vocabIds);
}
