package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.ExerciseAttemptRequest;
import com.Kiet.Sun_HSK.dto.response.ExerciseAttemptResponse;
import com.Kiet.Sun_HSK.dto.response.ExerciseResponse;
import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseService {

    ExerciseRepository exerciseRepository;
    FillBlankExerciseRepository fillBlankExerciseRepository;
    SentenceOrderingExerciseRepository sentenceOrderingExerciseRepository;
    ListeningExerciseRepository listeningExerciseRepository;
    UserExerciseAttemptRepository userExerciseAttemptRepository;
    UserRepository userRepository;
    VocabularyService vocabularyService;

    private static final String PUNCT_REGEX = "[\\p{Punct}\\s\\u3000-\\u303F\\uFF00-\\uFFEF\\u2000-\\u206F]+";

    private String normalizeChinese(String input) {
        if (input == null) return "";
        return input.replaceAll(PUNCT_REGEX, "").trim();
    }

    @Transactional(readOnly = true)
    public List<ExerciseResponse> getByLevelAndType(int level, ExerciseType type, Integer lessonNumber, int pageSize) {
        List<Exercise> exercises;
        if (lessonNumber != null && lessonNumber > 0) {
            List<Long> vocabIds = vocabularyService.getLessonWordIds(level, lessonNumber, pageSize);
            if (vocabIds.isEmpty()) {
                return Collections.emptyList();
            }
            if (type != null) {
                exercises = exerciseRepository.findByVocabularyIdInAndExerciseTypeWithDetails(vocabIds, type);
            } else {
                exercises = exerciseRepository.findByVocabularyIdInWithDetails(vocabIds);
            }
        } else {
            if (type != null) {
                exercises = exerciseRepository.findByLevelAndTypeWithDetails(level, type);
            } else {
                exercises = exerciseRepository.findByLevelWithDetails(level);
            }
        }

        return exercises.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExerciseAttemptResponse attemptExercise(UUID userId, Long exerciseId, ExerciseAttemptRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));

        boolean correct = false;
        String correctAnswer = "";

        if (exercise.getExerciseType() == ExerciseType.FILL_BLANK) {
            FillBlankExercise fb = fillBlankExerciseRepository.findByExerciseId(exerciseId)
                    .orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));
            correctAnswer = fb.getAnswer();
            String submitted = req.getUserAnswer() != null ? req.getUserAnswer().trim() : "";
            correct = submitted.equalsIgnoreCase(correctAnswer.trim());
        } else if (exercise.getExerciseType() == ExerciseType.SENTENCE_ORDERING) {
            SentenceOrderingExercise ordering = sentenceOrderingExerciseRepository.findByExerciseIdWithTokens(exerciseId)
                    .orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));

            // Ghép tokens theo thứ tự position ban đầu làm đáp án đúng
            correctAnswer = ordering.getTokens().stream()
                    .map(SentenceOrderingToken::getToken)
                    .collect(Collectors.joining(""));

            String submitted = normalizeChinese(req.getUserAnswer());
            String expected = normalizeChinese(correctAnswer);
            correct = !submitted.isEmpty() && submitted.equals(expected);
        } else if (exercise.getExerciseType() == ExerciseType.LISTENING) {
            if (exercise.getExample() != null) {
                correctAnswer = exercise.getExample().getZh();
            } else {
                correctAnswer = exercise.getVocabulary().getHanzi();
            }
            String submitted = normalizeChinese(req.getUserAnswer());
            String expected = normalizeChinese(correctAnswer);
            correct = !submitted.isEmpty() && submitted.equalsIgnoreCase(expected);
        }

        UserExerciseAttempt attempt = UserExerciseAttempt.builder()
                .user(user)
                .exercise(exercise)
                .isCorrect(correct)
                .userAnswer(req.getUserAnswer())
                .timeSpentSecs(req.getTimeSpentSecs())
                .build();

        userExerciseAttemptRepository.save(attempt);

        return ExerciseAttemptResponse.builder()
                .exerciseId(exerciseId)
                .correct(correct)
                .userAnswer(req.getUserAnswer())
                .correctAnswer(correctAnswer)
                .explanation(exercise.getExplanation())
                .build();
    }

    private ExerciseResponse mapToResponse(Exercise e) {
        String blankText = null;
        List<String> tokens = null;
        String correctAnswer = null;

        if (e.getExerciseType() == ExerciseType.FILL_BLANK) {
            FillBlankExercise fb = fillBlankExerciseRepository.findByExerciseId(e.getId()).orElse(null);
            if (fb != null) {
                blankText = fb.getBlankText();
                correctAnswer = fb.getAnswer();
            }
        } else if (e.getExerciseType() == ExerciseType.SENTENCE_ORDERING) {
            SentenceOrderingExercise ordering = sentenceOrderingExerciseRepository.findByExerciseIdWithTokens(e.getId()).orElse(null);
            if (ordering != null) {
                List<String> originalTokens = ordering.getTokens().stream()
                        .map(SentenceOrderingToken::getToken)
                        .collect(Collectors.toList());

                correctAnswer = String.join("", originalTokens);

                // Xáo trộn tokens để gửi xuống cho frontend
                tokens = new ArrayList<>(originalTokens);
                Collections.shuffle(tokens);
            }
        } else if (e.getExerciseType() == ExerciseType.LISTENING) {
            if (e.getExample() != null) {
                correctAnswer = e.getExample().getZh();
            } else {
                correctAnswer = e.getVocabulary().getHanzi();
            }
        }

        String audioPath = (e.getExample() != null && e.getExample().getAudioPath() != null)
                ? e.getExample().getAudioPath()
                : e.getVocabulary().getAudioPath();

        return ExerciseResponse.builder()
                .id(e.getId())
                .exerciseType(e.getExerciseType())
                .hskLevel(e.getHskLevel())
                .vocabularyId(e.getVocabulary().getId())
                .hanzi(e.getVocabulary().getHanzi())
                .exampleId(e.getExample() != null ? e.getExample().getId() : null)
                .sentenceZh(e.getExample() != null ? e.getExample().getZh() : null)
                .sentenceVi(e.getExample() != null ? e.getExample().getVi() : null)
                .audioPath(audioPath)
                .difficulty(e.getDifficulty())
                .explanation(e.getExplanation())
                .blankText(blankText)
                .tokens(tokens)
                .correctAnswer(correctAnswer)
                .build();
    }
}
