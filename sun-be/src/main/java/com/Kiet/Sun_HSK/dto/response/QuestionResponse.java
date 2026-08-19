package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.QuestionType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestionResponse {

    UUID id;
    QuestionType questionType;
    String content;
    String audioUrl;
    String imageUrl;
    int points;
    int sortOrder;
    List<QuestionOptionResponse> options;

    // explanation và correctAnswer KHÔNG có ở đây — chỉ trả sau khi nộp bài
}
