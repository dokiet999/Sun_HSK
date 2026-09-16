package com.Kiet.Sun_HSK.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExerciseAttemptResponse {

    Long exerciseId;

    boolean correct;

    String userAnswer;

    String correctAnswer;

    String explanation;
}
