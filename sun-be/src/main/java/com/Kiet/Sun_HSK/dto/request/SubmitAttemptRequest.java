package com.Kiet.Sun_HSK.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmitAttemptRequest {

    /** Toàn bộ câu trả lời tại thời điểm nộp bài */
    @NotNull
    @Valid
    List<AnswerItemRequest> answers;

    /** Số giây thực tế đã làm bài */
    Integer timeSpentSecs;
}
