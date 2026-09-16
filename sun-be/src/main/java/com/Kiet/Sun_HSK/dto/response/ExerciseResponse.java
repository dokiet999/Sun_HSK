package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.ExerciseType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExerciseResponse {

    Long id;

    ExerciseType exerciseType;

    int hskLevel;

    Long vocabularyId;

    String hanzi;

    Long exampleId;

    String sentenceZh;

    String sentenceVi;

    String audioPath;

    int difficulty;

    String explanation;

    /** Fill Blank Exercise */
    String blankText;

    /** Sentence Ordering Exercise: các token xáo trộn để người dùng chọn/kéo thả */
    List<String> tokens;

    /** Đáp án đúng (để so sánh hoặc reveal khi làm xong) */
    String correctAnswer;
}
