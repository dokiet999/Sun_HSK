package com.Kiet.Sun_HSK.dto.request;

import com.Kiet.Sun_HSK.enums.QuestionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateQuestionRequest {

    @NotNull(message = "Dạng câu hỏi không được để trống")
    QuestionType questionType;

    String content;

    String audioUrl;

    String imageUrl;

    @Min(value = 1, message = "Điểm tối thiểu là 1")
    int points = 1;

    int sortOrder = 0;

    String explanation;

    /** Dùng cho Fill-in-blank */
    String correctAnswer;
}
