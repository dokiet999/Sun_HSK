package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.VocabularyLearningStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVocabularyResponse {

    Long id;

    Long vocabularyId;

    String hanzi;

    String pinyin;

    String meaningVi;

    String audioPath;

    int hskLevel;

    VocabularyLearningStatus status;

    Boolean inReviewList;

    LocalDateTime lastReviewedAt;

    LocalDateTime nextReviewAt;

    int reviewCount;

    int correctCount;

    int wrongCount;
}
