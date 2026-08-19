package com.Kiet.Sun_HSK.dto.request;

import com.Kiet.Sun_HSK.enums.ExamType;
import com.Kiet.Sun_HSK.enums.HskVersion;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateExamRequest {

    @NotBlank(message = "Tiêu đề đề thi không được để trống")
    @Size(max = 255)
    String title;

    String description;

    @NotNull(message = "Phiên bản HSK không được để trống")
    HskVersion hskVersion;

    @NotNull
    @Min(value = 1, message = "Cấp độ HSK tối thiểu là 1")
    @Max(value = 9, message = "Cấp độ HSK tối đa là 9")
    Integer hskLevel;

    @NotNull
    ExamType examType;

    @NotNull
    @Min(value = 1, message = "Thời gian tối thiểu 1 phút")
    @Max(value = 300, message = "Thời gian tối đa 300 phút")
    Integer timeLimit;

    @Min(value = 1, message = "Điểm đạt tối thiểu 1%")
    @Max(value = 100, message = "Điểm đạt tối đa 100%")
    Integer passingScore = 60;
}
