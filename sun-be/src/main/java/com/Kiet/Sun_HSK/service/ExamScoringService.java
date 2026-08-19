package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.AnswerItemRequest;
import com.Kiet.Sun_HSK.entity.AttemptAnswer;
import com.Kiet.Sun_HSK.entity.Question;
import com.Kiet.Sun_HSK.entity.QuestionOption;
import com.Kiet.Sun_HSK.enums.QuestionType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExamScoringService {

    ObjectMapper objectMapper;

    /**
     * Chấm điểm một câu trả lời.
     *
     * @param answer  entity AttemptAnswer cần chấm (sẽ được set isCorrect và pointsEarned)
     * @param question câu hỏi tương ứng
     * @param options  toàn bộ options của câu hỏi đó
     */
    public void score(AttemptAnswer answer, Question question, List<QuestionOption> options) {
        QuestionType type = question.getQuestionType();

        switch (type) {
            case MULTIPLE_CHOICE, TRUE_FALSE, PICTURE_SELECTION, DIALOGUE_LISTENING ->
                    scoreOptionBased(answer, question, options);

            case FILL_IN_BLANK ->
                    scoreFillInBlank(answer, question);

            case MATCHING ->
                    scoreMatching(answer, question, options);

            case SENTENCE_ORDERING ->
                    scoreSentenceOrdering(answer, question, options);

            case WRITING -> {
                // Writing không tự chấm — admin review thủ công
                answer.setIsCorrect(null);
                answer.setPointsEarned(0);
            }

            default -> {
                log.warn("Unknown question type: {}", type);
                answer.setIsCorrect(false);
                answer.setPointsEarned(0);
            }
        }
    }

    // ── Private scorers ───────────────────────────────────────────────────────

    private void scoreOptionBased(AttemptAnswer answer, Question question,
                                   List<QuestionOption> options) {
        if (answer.getSelectedOptionId() == null) {
            answer.setIsCorrect(false);
            answer.setPointsEarned(0);
            return;
        }

        UUID selectedId = answer.getSelectedOptionId();
        boolean isCorrect = options.stream()
                .filter(QuestionOption::isCorrect)
                .anyMatch(o -> o.getId().equals(selectedId));

        answer.setIsCorrect(isCorrect);
        answer.setPointsEarned(isCorrect ? question.getPoints() : 0);
    }

    private void scoreFillInBlank(AttemptAnswer answer, Question question) {
        String given = normalize(answer.getTextAnswer());
        String correct = normalize(question.getCorrectAnswer());

        if (given.isEmpty() || correct.isEmpty()) {
            answer.setIsCorrect(false);
            answer.setPointsEarned(0);
            return;
        }

        boolean isCorrect = given.equals(correct);
        answer.setIsCorrect(isCorrect);
        answer.setPointsEarned(isCorrect ? question.getPoints() : 0);
    }

    private void scoreMatching(AttemptAnswer answer, Question question,
                                List<QuestionOption> options) {
        if (answer.getMatchPairs() == null || answer.getMatchPairs().isBlank()) {
            answer.setIsCorrect(false);
            answer.setPointsEarned(0);
            return;
        }

        try {
            Map<String, String> userPairs = objectMapper.readValue(
                    answer.getMatchPairs(), new TypeReference<>() {});

            // Tạo map đúng: optionId → matchKey từ database
            Map<String, String> correctPairs = options.stream()
                    .filter(o -> o.getMatchKey() != null)
                    .collect(Collectors.toMap(
                            o -> o.getId().toString(),
                            QuestionOption::getMatchKey
                    ));

            // Đúng toàn bộ mới cho điểm (strict matching)
            boolean allCorrect = !correctPairs.isEmpty()
                    && correctPairs.entrySet().stream()
                    .allMatch(e -> e.getValue().equals(userPairs.get(e.getKey())));

            answer.setIsCorrect(allCorrect);
            answer.setPointsEarned(allCorrect ? question.getPoints() : 0);
        } catch (JsonProcessingException e) {
            log.warn("Invalid matchPairs JSON for answer {}: {}", answer.getId(), e.getMessage());
            answer.setIsCorrect(false);
            answer.setPointsEarned(0);
        }
    }

    private void scoreSentenceOrdering(AttemptAnswer answer, Question question,
                                        List<QuestionOption> options) {
        if (answer.getOrderAnswer() == null || answer.getOrderAnswer().isBlank()) {
            answer.setIsCorrect(false);
            answer.setPointsEarned(0);
            return;
        }

        try {
            List<String> userOrder = objectMapper.readValue(
                    answer.getOrderAnswer(), new TypeReference<>() {});

            // Thứ tự đúng theo sortOrder của options
            List<String> correctOrder = options.stream()
                    .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                    .map(o -> o.getId().toString())
                    .toList();

            boolean isCorrect = userOrder.equals(correctOrder);
            answer.setIsCorrect(isCorrect);
            answer.setPointsEarned(isCorrect ? question.getPoints() : 0);
        } catch (JsonProcessingException e) {
            log.warn("Invalid orderAnswer JSON for answer {}: {}", answer.getId(), e.getMessage());
            answer.setIsCorrect(false);
            answer.setPointsEarned(0);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /** Chuẩn hóa text để so sánh Fill-in-blank: lowercase, trim, bỏ dấu câu dư */
    private String normalize(String text) {
        if (text == null) return "";
        return text.trim().toLowerCase()
                .replaceAll("\\s+", " ")
                .replaceAll("[.,!?;:]$", "");
    }

    // ── JSON helpers (dùng trong AttemptService) ──────────────────────────────

    public String toJson(Object obj) {
        try {
            return obj == null ? null : objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
