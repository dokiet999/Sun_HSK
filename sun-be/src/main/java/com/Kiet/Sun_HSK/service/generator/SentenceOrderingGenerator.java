package com.Kiet.Sun_HSK.service.generator;

import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import com.Kiet.Sun_HSK.repository.ExerciseRepository;
import com.Kiet.Sun_HSK.repository.SentenceOrderingExerciseRepository;
import com.Kiet.Sun_HSK.repository.SentenceOrderingTokenRepository;
import com.Kiet.Sun_HSK.service.strategy.ChineseTokenizationStrategy;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SentenceOrderingGenerator {

    ExerciseRepository exerciseRepository;
    SentenceOrderingExerciseRepository sentenceOrderingExerciseRepository;
    SentenceOrderingTokenRepository sentenceOrderingTokenRepository;
    ChineseTokenizationStrategy tokenizationStrategy;

    public Optional<SentenceOrderingExercise> generate(Vocabulary vocab, VocabularyExample example) {
        if (example.getZh() == null || example.getZh().isBlank()) {
            return Optional.empty();
        }

        List<String> tokens = tokenizationStrategy.tokenize(example.getZh(), vocab.getHskLevel());
        if (tokens.size() < 2) {
            return Optional.empty();
        }

        // 1. Tạo Exercise cha
        int difficulty = tokens.size() <= 3 ? 1 : (tokens.size() <= 5 ? 2 : 3);
        Exercise exercise = Exercise.builder()
                .exerciseType(ExerciseType.SENTENCE_ORDERING)
                .hskLevel(vocab.getHskLevel())
                .vocabulary(vocab)
                .example(example)
                .difficulty(difficulty)
                .explanation("Câu hoàn chỉnh: " + example.getZh() + " (" + example.getVi() + ")")
                .build();
        Exercise savedExercise = exerciseRepository.save(exercise);

        // 2. Tạo SentenceOrderingExercise con
        SentenceOrderingExercise orderingExercise = SentenceOrderingExercise.builder()
                .exercise(savedExercise)
                .build();
        SentenceOrderingExercise savedOrdering = sentenceOrderingExerciseRepository.save(orderingExercise);

        // 3. Tạo các tokens tương ứng
        List<SentenceOrderingToken> tokenEntities = new ArrayList<>();
        for (int pos = 0; pos < tokens.size(); pos++) {
            SentenceOrderingToken tokenEntity = SentenceOrderingToken.builder()
                    .sentenceOrderingExercise(savedOrdering)
                    .token(tokens.get(pos))
                    .position(pos)
                    .build();
            tokenEntities.add(tokenEntity);
        }
        sentenceOrderingTokenRepository.saveAll(tokenEntities);
        savedOrdering.setTokens(tokenEntities);

        return Optional.of(savedOrdering);
    }
}
