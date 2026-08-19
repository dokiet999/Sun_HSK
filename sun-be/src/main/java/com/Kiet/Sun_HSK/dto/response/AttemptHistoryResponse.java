package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.AttemptStatus;
import com.Kiet.Sun_HSK.enums.ExamType;
import com.Kiet.Sun_HSK.enums.HskVersion;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Một mục trong lịch sử làm bài */
@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttemptHistoryResponse {

    UUID attemptId;
    UUID examId;
    String examTitle;
    HskVersion hskVersion;
    int hskLevel;
    ExamType examType;

    AttemptStatus status;
    LocalDateTime startedAt;
    LocalDateTime submittedAt;
    Integer timeSpentSecs;

    int totalScore;
    int totalPoints;
    BigDecimal scorePercent;
    boolean passed;
}
