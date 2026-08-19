package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.SectionType;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SectionResponse {

    UUID id;
    SectionType sectionType;
    String title;
    String instructions;
    Integer timeLimit;
    int sortOrder;
    List<QuestionResponse> questions;
}
