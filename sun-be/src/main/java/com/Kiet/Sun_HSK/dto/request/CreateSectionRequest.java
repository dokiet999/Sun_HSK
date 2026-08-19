package com.Kiet.Sun_HSK.dto.request;

import com.Kiet.Sun_HSK.enums.SectionType;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateSectionRequest {

    @NotNull(message = "Loại phần thi không được để trống")
    SectionType sectionType;

    String title;

    String instructions;

    Integer timeLimit;

    int sortOrder = 0;
}
