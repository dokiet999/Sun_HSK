package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.AttemptStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Kết quả sau khi nộp bài */
@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttemptResultResponse {

    UUID attemptId;
    UUID examId;
    String examTitle;
    AttemptStatus status;

    // Thời gian
    LocalDateTime startedAt;
    LocalDateTime submittedAt;
    Integer timeSpentSecs;

    // Điểm tổng
    int totalScore;
    int totalPoints;
    BigDecimal scorePercent;
    boolean passed;

    // Điểm theo phần
    int listeningScore;
    int readingScore;
    int writingScore;

    // Chi tiết từng câu
    List<AttemptAnswerDetailResponse> answers;
}
