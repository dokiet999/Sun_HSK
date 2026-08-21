package com.Kiet.Sun_HSK.dto.request;

import com.Kiet.Sun_HSK.enums.SectionType;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateSectionRequest {

    SectionType sectionType;

    String title;

    String instructions;

    Integer timeLimit;

    Integer sortOrder;
}
