package com.Kiet.Sun_HSK.dto.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateQuestionOptionRequest {

    String content;

    String imageUrl;

    Boolean isCorrect;

    String matchKey;

    Integer sortOrder;
}
