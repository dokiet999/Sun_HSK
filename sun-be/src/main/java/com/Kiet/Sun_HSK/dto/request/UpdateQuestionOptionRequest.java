package com.Kiet.Sun_HSK.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateQuestionOptionRequest {

    String content;

    String imageUrl;

    @JsonProperty("isCorrect")
    Boolean isCorrect;

    String matchKey;

    Integer sortOrder;
}
