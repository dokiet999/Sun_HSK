package com.Kiet.Sun_HSK.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateQuestionOptionRequest {

    @NotBlank(message = "Nội dung lựa chọn không được để trống")
    String content;

    String imageUrl;

    boolean isCorrect = false;

    /** Key cho dạng Matching — ví dụ: "A", "B" */
    String matchKey;

    int sortOrder = 0;
}
