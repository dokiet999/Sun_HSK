package com.Kiet.Sun_HSK.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonSummaryResponse {

    int lessonNumber;

    String title;

    int totalWords;

    int learnedWords;

    int masteredWords;

    double progressPercent;

    boolean isCompleted;
}
