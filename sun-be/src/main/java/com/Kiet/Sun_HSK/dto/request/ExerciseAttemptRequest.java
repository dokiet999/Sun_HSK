package com.Kiet.Sun_HSK.dto.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExerciseAttemptRequest {

    String userAnswer;

    Integer timeSpentSecs;
}
