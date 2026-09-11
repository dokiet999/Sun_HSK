package com.Kiet.Sun_HSK.service.generator;

import com.Kiet.Sun_HSK.entity.Exercise;
import com.Kiet.Sun_HSK.entity.FillBlankExercise;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.entity.VocabularyExample;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import com.Kiet.Sun_HSK.repository.ExerciseRepository;
import com.Kiet.Sun_HSK.repository.FillBlankExerciseRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FillBlankGenerator {

    ExerciseRepository exerciseRepository;
    FillBlankExerciseRepository fillBlankExerciseRepository;

    public Optional<FillBlankExercise> generate(Vocabulary vocab, VocabularyExample example) {
        if (vocab.getHanzi() == null || example.getZh() == null) {
            return Optional.empty();
        }

        String hanzi = vocab.getHanzi().trim();
        String zh = example.getZh().trim();

        if (!zh.contains(hanzi)) {
            return Optional.empty();
        }

        // Tạo bài tập cha Exercise
        Exercise exercise = Exercise.builder()
                .exerciseType(ExerciseType.FILL_BLANK)
                .hskLevel(vocab.getHskLevel())
                .vocabulary(vocab)
                .example(example)
                .difficulty(1)
                .explanation("Từ cần điền: " + hanzi + " (" + vocab.getPinyin() + " - " + vocab.getMeaningVi() + ")")
                .build();
        Exercise savedExercise = exerciseRepository.save(exercise);

        // Tạo bài tập con FillBlankExercise
        String blankText = zh.replaceFirst(Pattern.quote(hanzi), "____");
        FillBlankExercise fillBlank = FillBlankExercise.builder()
                .exercise(savedExercise)
                .blankText(blankText)
                .answer(hanzi)
                .build();

        return Optional.of(fillBlankExerciseRepository.save(fillBlank));
    }
}
