package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.QuestionType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

/** Chi tiết kết quả từng câu — trả về sau khi nộp bài */
@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttemptAnswerDetailResponse {

    UUID questionId;
    QuestionType questionType;
    String questionContent;
    String explanation;

    // Câu trả lời của user
    UUID selectedOptionId;
    String selectedOptionContent;
    String textAnswer;

    // Đáp án đúng
    UUID correctOptionId;
    String correctOptionContent;
    String correctAnswer;

    // Kết quả
    Boolean isCorrect;         // null = Writing (chưa chấm)
    int pointsEarned;
    int totalPoints;

    // Options với isCorrect (hiển thị sau nộp bài)
    List<AnswerOptionDetailResponse> options;

    @Getter
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class AnswerOptionDetailResponse {
        UUID id;
        String content;
        String imageUrl;
        String matchKey;
        boolean isCorrect;
        int sortOrder;
    }
}
