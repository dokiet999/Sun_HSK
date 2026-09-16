package com.Kiet.Sun_HSK.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonVocabularyResponse {

    int level;

    int lessonNumber;

    int wordsPerLesson;

    int totalWordsInLesson;

    int totalLessons;

    List<VocabularyResponse> words;
}
