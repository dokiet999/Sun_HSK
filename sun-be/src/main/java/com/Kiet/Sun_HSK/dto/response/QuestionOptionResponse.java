package com.Kiet.Sun_HSK.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

/**
 * Option response khi user đang làm bài — KHÔNG có isCorrect.
 * isCorrect chỉ được trả về trong AttemptAnswerDetailResponse sau khi nộp bài.
 */
@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuestionOptionResponse {

    UUID id;
    String content;
    String imageUrl;
    String matchKey;
    int sortOrder;
}
