package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.entity.AttemptAnswer;
import com.Kiet.Sun_HSK.entity.Question;
import com.Kiet.Sun_HSK.entity.QuestionOption;
import com.Kiet.Sun_HSK.enums.QuestionType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;


import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ExamScoringService Unit Tests")
class ExamScoringServiceTest {

    private ObjectMapper objectMapper;

    private ExamScoringService scoringService;

    private static final UUID QUESTION_ID = UUID.randomUUID();
    private static final UUID OPTION_ID_A = UUID.randomUUID();
    private static final UUID OPTION_ID_B = UUID.randomUUID();
    private static final UUID OPTION_ID_C = UUID.randomUUID();
    private static final UUID OPTION_ID_D = UUID.randomUUID();

    private Question question;
    private AttemptAnswer answer;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        scoringService = new ExamScoringService(objectMapper);

        question = Question.builder()
                .id(QUESTION_ID)
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .content("What is the capital of China?")
                .points(5)
                .build();

        answer = AttemptAnswer.builder()
                .id(UUID.randomUUID())
                .question(question)
                .build();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NESTED TEST CLASSES FOR EACH QUESTION TYPE
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Multiple Choice Scoring")
    class MultipleChoiceScoringTests {

        @Test
        @DisplayName("Should score correct answer as correct with full points")
        void shouldScoreCorrectAnswer() {
            // Arrange
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Beijing")
                            .isCorrect(true)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("Shanghai")
                            .isCorrect(false)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_C)
                            .content("Chengdu")
                            .isCorrect(false)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_D)
                            .content("Guangzhou")
                            .isCorrect(false)
                            .build()
            );

            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should score incorrect answer as incorrect with zero points")
        void shouldScoreIncorrectAnswer() {
            // Arrange
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Beijing")
                            .isCorrect(true)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("Shanghai")
                            .isCorrect(false)
                            .build()
            );

            answer.setSelectedOptionId(OPTION_ID_B);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle null selected option as incorrect")
        void shouldHandleNullSelectedOption() {
            // Arrange
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Beijing")
                            .isCorrect(true)
                            .build()
            );

            answer.setSelectedOptionId(null);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should score with different point values")
        void shouldScoreWithDifferentPoints() {
            // Arrange
            question.setPoints(10);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Correct")
                            .isCorrect(true)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getPointsEarned()).isEqualTo(10);
        }
    }

    @Nested
    @DisplayName("True/False Scoring")
    class TrueFalseScoringTests {

        @Test
        @DisplayName("Should score correct True answer")
        void shouldScoreCorrectTrueAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.TRUE_FALSE);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("True")
                            .isCorrect(true)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("False")
                            .isCorrect(false)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should score correct False answer")
        void shouldScoreCorrectFalseAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.TRUE_FALSE);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("True")
                            .isCorrect(false)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("False")
                            .isCorrect(true)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_B);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("Fill In Blank Scoring")
    class FillInBlankScoringTests {

        @Test
        @DisplayName("Should score exact match as correct")
        void shouldScoreExactMatch() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer("Beijing");
            answer.setTextAnswer("Beijing");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should normalize case and whitespace before comparison")
        void shouldNormalizeBeforeComparison() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer("Beijing");
            answer.setTextAnswer("  BEIJING  ");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should remove trailing punctuation before comparison")
        void shouldRemoveTrailingPunctuation() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer("Beijing");
            answer.setTextAnswer("Beijing.");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
        }

        @Test
        @DisplayName("Should handle multiple spaces in text")
        void shouldHandleMultipleSpaces() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer("The capital");
            answer.setTextAnswer("The    capital");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
        }

        @Test
        @DisplayName("Should score incorrect answer as wrong")
        void shouldScoreIncorrectAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer("Beijing");
            answer.setTextAnswer("Shanghai");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle null text answer as incorrect")
        void shouldHandleNullTextAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer("Beijing");
            answer.setTextAnswer(null);
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle null correct answer as incorrect")
        void shouldHandleNullCorrectAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer(null);
            answer.setTextAnswer("Beijing");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle empty strings as incorrect")
        void shouldHandleEmptyStrings() {
            // Arrange
            question.setQuestionType(QuestionType.FILL_IN_BLANK);
            question.setCorrectAnswer("");
            answer.setTextAnswer("Beijing");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Matching Scoring")
    class MatchingScoringTests {

        @Test
        @DisplayName("Should score correct matching pairs")
        void shouldScoreCorrectMatchingPairs() {
            // Arrange
            question.setQuestionType(QuestionType.MATCHING);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Beijing")
                            .matchKey("1")
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("Shanghai")
                            .matchKey("2")
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_C)
                            .content("Chengdu")
                            .matchKey("3")
                            .build()
            );

            String matchPairsJson = "{\"" + OPTION_ID_A + "\":\"1\",\"" + OPTION_ID_B + "\":\"2\",\"" + OPTION_ID_C + "\":\"3\"}";
            answer.setMatchPairs(matchPairsJson);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should score partially correct matching as incorrect (strict matching)")
        void shouldScorePartialMatchAsIncorrect() {
            // Arrange
            question.setQuestionType(QuestionType.MATCHING);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Beijing")
                            .matchKey("1")
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("Shanghai")
                            .matchKey("2")
                            .build()
            );

            // User provided wrong match for second option
            String matchPairsJson = "{\"" + OPTION_ID_A + "\":\"1\",\"" + OPTION_ID_B + "\":\"3\"}";
            answer.setMatchPairs(matchPairsJson);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should reject matching pairs containing an extra option")
        void shouldRejectExtraMatchingPair() {
            question.setQuestionType(QuestionType.MATCHING);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder().id(OPTION_ID_A).matchKey("1").build(),
                    QuestionOption.builder().id(OPTION_ID_B).matchKey("2").build()
            );

            String matchPairsJson = "{\"" + OPTION_ID_A + "\":\"1\",\""
                    + OPTION_ID_B + "\":\"2\",\"" + OPTION_ID_C + "\":\"3\"}";
            answer.setMatchPairs(matchPairsJson);

            scoringService.score(answer, question, options);

            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle null match pairs as incorrect")
        void shouldHandleNullMatchPairs() {
            // Arrange
            question.setQuestionType(QuestionType.MATCHING);
            answer.setMatchPairs(null);
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle blank match pairs as incorrect")
        void shouldHandleBlankMatchPairs() {
            // Arrange
            question.setQuestionType(QuestionType.MATCHING);
            answer.setMatchPairs("  ");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle invalid JSON in match pairs")
        void shouldHandleInvalidJsonInMatchPairs() {
            // Arrange
            question.setQuestionType(QuestionType.MATCHING);
            String invalidJson = "{invalid json}";
            answer.setMatchPairs(invalidJson);

            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle empty options with matching type")
        void shouldHandleEmptyOptionsWithMatching() {
            // Arrange
            question.setQuestionType(QuestionType.MATCHING);
            String matchPairsJson = "{}";
            answer.setMatchPairs(matchPairsJson);

            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Sentence Ordering Scoring")
    class SentenceOrderingScoringTests {

        @Test
        @DisplayName("Should score correct sentence order")
        void shouldScoreCorrectOrder() {
            // Arrange
            question.setQuestionType(QuestionType.SENTENCE_ORDERING);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("The cat")
                            .sortOrder(1)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("is on")
                            .sortOrder(2)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_C)
                            .content("the mat")
                            .sortOrder(3)
                            .build()
            );

            String orderJson = "[\"" + OPTION_ID_A + "\",\"" + OPTION_ID_B + "\",\"" + OPTION_ID_C + "\"]";
            answer.setOrderAnswer(orderJson);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should score incorrect sentence order as wrong")
        void shouldScoreIncorrectOrder() {
            // Arrange
            question.setQuestionType(QuestionType.SENTENCE_ORDERING);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("The cat")
                            .sortOrder(1)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("is on")
                            .sortOrder(2)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_C)
                            .content("the mat")
                            .sortOrder(3)
                            .build()
            );

            // User provided wrong order
            String orderJson = "[\"" + OPTION_ID_B + "\",\"" + OPTION_ID_A + "\",\"" + OPTION_ID_C + "\"]";
            answer.setOrderAnswer(orderJson);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle null order answer as incorrect")
        void shouldHandleNullOrderAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.SENTENCE_ORDERING);
            answer.setOrderAnswer(null);
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle invalid JSON in order answer")
        void shouldHandleInvalidJsonInOrderAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.SENTENCE_ORDERING);
            String invalidJson = "[invalid json]";
            answer.setOrderAnswer(invalidJson);

            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should not score an empty sentence order when the question has no options")
        void shouldNotScoreEmptyOrderWithoutOptions() {
            question.setQuestionType(QuestionType.SENTENCE_ORDERING);
            answer.setOrderAnswer("[]");

            scoringService.score(answer, question, List.of());

            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Picture Selection Scoring")
    class PictureSelectionScoringTests {

        @Test
        @DisplayName("Should score correct picture selection")
        void shouldScoreCorrectPicture() {
            // Arrange
            question.setQuestionType(QuestionType.PICTURE_SELECTION);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Picture A")
                            .imageUrl("url_a.jpg")
                            .isCorrect(true)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("Picture B")
                            .imageUrl("url_b.jpg")
                            .isCorrect(false)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("Dialogue Listening Scoring")
    class DialogueListeningScoringTests {

        @Test
        @DisplayName("Should score correct dialogue listening answer")
        void shouldScoreCorrectDialogueAnswer() {
            // Arrange
            question.setQuestionType(QuestionType.DIALOGUE_LISTENING);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Answer A")
                            .isCorrect(true)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("Answer B")
                            .isCorrect(false)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("Writing Scoring")
    class WritingScoringTests {

        @Test
        @DisplayName("Should not auto-score writing questions (require manual review)")
        void shouldNotAutoScoreWriting() {
            // Arrange
            question.setQuestionType(QuestionType.WRITING);
            answer.setTextAnswer("User's written answer here...");
            List<QuestionOption> options = new ArrayList<>();

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isNull();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Helper Methods")
    class HelperMethodsTests {

        @Test
        @DisplayName("toJson should serialize object to JSON string")
        void testToJsonSerialization() {
            // Arrange
            Map<String, String> testMap = new HashMap<>();
            testMap.put("key1", "value1");
            testMap.put("key2", "value2");

            // Act
            String result = scoringService.toJson(testMap);

            // Assert
            assertThat(result).contains("key1").contains("value1").contains("key2").contains("value2");
        }

        @Test
        @DisplayName("toJson should return null for null input")
        void testToJsonWithNull() {
            // Act
            String result = scoringService.toJson(null);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("toJson should serialize and deserialize correctly")
        void testToJsonRoundTrip() throws Exception {
            // Arrange
            List<String> testList = Arrays.asList("item1", "item2", "item3");

            // Act
            String json = scoringService.toJson(testList);
            List<String> deserialized = objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});

            // Assert
            assertThat(deserialized).isEqualTo(testList);
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle zero points question")
        void shouldHandleZeroPointsQuestion() {
            // Arrange
            question.setPoints(0);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Correct")
                            .isCorrect(true)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle high points value")
        void shouldHandleHighPointsValue() {
            // Arrange
            question.setPoints(100);
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Correct")
                            .isCorrect(true)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getPointsEarned()).isEqualTo(100);
        }

        @Test
        @DisplayName("Should handle empty options list for option-based question")
        void shouldHandleEmptyOptionsList() {
            // Arrange
            List<QuestionOption> options = new ArrayList<>();
            answer.setSelectedOptionId(OPTION_ID_A);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isFalse();
            assertThat(answer.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should accept any selected option marked correct")
        void shouldAcceptAnySelectedCorrectOption() {
            // Arrange
            List<QuestionOption> options = Arrays.asList(
                    QuestionOption.builder()
                            .id(OPTION_ID_A)
                            .content("Correct A")
                            .isCorrect(true)
                            .build(),
                    QuestionOption.builder()
                            .id(OPTION_ID_B)
                            .content("Correct B")
                            .isCorrect(true)
                            .build()
            );
            answer.setSelectedOptionId(OPTION_ID_B);

            // Act
            scoringService.score(answer, question, options);

            // Assert
            assertThat(answer.getIsCorrect()).isTrue();
            assertThat(answer.getPointsEarned()).isEqualTo(5);
        }
    }
}
