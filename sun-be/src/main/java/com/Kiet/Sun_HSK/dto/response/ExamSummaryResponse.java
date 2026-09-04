package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.ExamStatus;
import com.Kiet.Sun_HSK.enums.ExamType;
import com.Kiet.Sun_HSK.enums.HskVersion;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class ExamSummaryResponse {

    UUID id;
    String title;
    String description;
    HskVersion hskVersion;
    int hskLevel;
    ExamType examType;
    int timeLimit;
    int totalQuestions;
    int totalPoints;
    int passingScore;
    ExamStatus status;
    LocalDateTime createdAt;

    /** Điểm % cao nhất của user trên đề này (null nếu chưa làm) */
    Double bestScorePercent;
}
