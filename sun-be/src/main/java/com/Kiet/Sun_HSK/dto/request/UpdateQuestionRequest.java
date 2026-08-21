package com.Kiet.Sun_HSK.dto.request;

import com.Kiet.Sun_HSK.enums.QuestionType;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateQuestionRequest {

    QuestionType questionType;

    String content;

    String audioUrl;

    String imageUrl;

    @Min(value = 1, message = "Điểm tối thiểu là 1")
    Integer points;

    Integer sortOrder;

    String explanation;

    /** Dùng cho Fill-in-blank */
    String correctAnswer;
}
