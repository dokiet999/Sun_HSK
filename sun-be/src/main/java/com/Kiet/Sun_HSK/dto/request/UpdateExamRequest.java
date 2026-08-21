package com.Kiet.Sun_HSK.dto.request;

import com.Kiet.Sun_HSK.enums.ExamType;
import com.Kiet.Sun_HSK.enums.ExamStatus;
import com.Kiet.Sun_HSK.enums.HskVersion;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Tất cả field là optional — chỉ field nào != null mới được cập nhật (PATCH-style trong PUT).
 */
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateExamRequest {

    @Size(max = 255, message = "Tiêu đề không quá 255 ký tự")
    String title;

    String description;

    HskVersion hskVersion;

    @Min(value = 1, message = "Cấp độ HSK tối thiểu là 1")
    @Max(value = 9, message = "Cấp độ HSK tối đa là 9")
    Integer hskLevel;

    ExamType examType;

    @Min(value = 1, message = "Thời gian tối thiểu 1 phút")
    @Max(value = 300, message = "Thời gian tối đa 300 phút")
    Integer timeLimit;

    @Min(value = 1, message = "Điểm đạt tối thiểu 1%")
    @Max(value = 100, message = "Điểm đạt tối đa 100%")
    Integer passingScore;

    /** Cho phép admin chuyển trạng thái trực tiếp (DRAFT ↔ PUBLISHED ↔ ARCHIVED) */
    ExamStatus status;
}
