package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.ExamType;
import com.Kiet.Sun_HSK.enums.HskVersion;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

import lombok.Setter;
import lombok.experimental.FieldDefaults;

/** Trả về khi user vào xem đề thi — có đầy đủ câu hỏi nhưng KHÔNG có đáp án */
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamDetailResponse {

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
    List<SectionResponse> sections;
}
