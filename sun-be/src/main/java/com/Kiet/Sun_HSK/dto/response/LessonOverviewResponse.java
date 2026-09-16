package com.Kiet.Sun_HSK.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonOverviewResponse {

    int level;

    long totalWords;

    int wordsPerLesson;

    int totalLessons;

    List<LessonSummaryResponse> lessons;
}
