package com.Kiet.Sun_HSK.service.generator;

import com.Kiet.Sun_HSK.entity.Exercise;
import com.Kiet.Sun_HSK.entity.ListeningExercise;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.entity.VocabularyExample;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import com.Kiet.Sun_HSK.repository.ExerciseRepository;
import com.Kiet.Sun_HSK.repository.ListeningExerciseRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListeningGenerator {

    ExerciseRepository exerciseRepository;
    ListeningExerciseRepository listeningExerciseRepository;

    public Optional<ListeningExercise> generate(Vocabulary vocab, VocabularyExample example) {
        String audio = (example != null && example.getAudioPath() != null)
                ? example.getAudioPath()
                : vocab.getAudioPath();

        if (audio == null || audio.isBlank()) {
            return Optional.empty();
        }

        String explanation;
        if (example != null && example.getZh() != null) {
            explanation = example.getZh() + (example.getVi() != null ? " (" + example.getVi() + ")" : "")
                    + " — " + vocab.getHanzi() + " [" + vocab.getPinyin() + "]: " + vocab.getMeaningVi();
        } else {
            explanation = vocab.getHanzi() + " [" + vocab.getPinyin() + "]: " + vocab.getMeaningVi();
        }

        Exercise exercise = Exercise.builder()
                .exerciseType(ExerciseType.LISTENING)
                .hskLevel(vocab.getHskLevel())
                .vocabulary(vocab)
                .example(example)
                .difficulty(1)
                .explanation(explanation)
                .build();
        Exercise savedExercise = exerciseRepository.save(exercise);

        ListeningExercise listeningExercise = ListeningExercise.builder()
                .exercise(savedExercise)
                .build();

        return Optional.of(listeningExerciseRepository.save(listeningExercise));
    }
}
