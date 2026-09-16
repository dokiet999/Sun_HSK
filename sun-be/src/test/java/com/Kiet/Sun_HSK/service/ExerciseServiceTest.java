package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.ExerciseAttemptRequest;
import com.Kiet.Sun_HSK.dto.response.ExerciseAttemptResponse;
import com.Kiet.Sun_HSK.dto.response.ExerciseResponse;
import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import com.Kiet.Sun_HSK.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExerciseServiceTest {

    @Mock
    private ExerciseRepository exerciseRepository;

    @Mock
    private FillBlankExerciseRepository fillBlankExerciseRepository;

    @Mock
    private SentenceOrderingExerciseRepository sentenceOrderingExerciseRepository;

    @Mock
    private ListeningExerciseRepository listeningExerciseRepository;

    @Mock
    private UserExerciseAttemptRepository userExerciseAttemptRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VocabularyService vocabularyService;

    @InjectMocks
    private ExerciseService exerciseService;

    private User mockUser;
    private Vocabulary mockVocab;
    private VocabularyExample mockExample;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .build();

        mockVocab = Vocabulary.builder()
                .id(1L)
                .hanzi("老师")
                .pinyin("lǎoshī")
                .meaningVi("giáo viên")
                .audioPath("words/1.mp3")
                .build();

        mockExample = VocabularyExample.builder()
                .id(10L)
                .vocabulary(mockVocab)
                .zh("我的老师很好。")
                .vi("Giáo viên của tôi rất tốt.")
                .audioPath("examples/10.mp3")
                .build();
    }

    @Test
    @DisplayName("Listening attempt bỏ qua dấu câu khi so khớp đáp án")
    void testAttemptExercise_listeningIgnoresPunctuation() {
        Exercise exercise = Exercise.builder()
                .id(100L)
                .exerciseType(ExerciseType.LISTENING)
                .vocabulary(mockVocab)
                .example(mockExample)
                .build();

        when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
        when(exerciseRepository.findById(100L)).thenReturn(Optional.of(exercise));

        // Người dùng gõ không có dấu chấm câu tiếng Trung 。
        ExerciseAttemptRequest reqWithoutPunct = ExerciseAttemptRequest.builder()
                .userAnswer("我的老师很好")
                .timeSpentSecs(5)
                .build();

        ExerciseAttemptResponse res = exerciseService.attemptExercise(mockUser.getId(), 100L, reqWithoutPunct);

        assertTrue(res.isCorrect(), "Người dùng nhập đúng chữ Hán nhưng thiếu dấu chấm vẫn phải được tính là ĐÚNG");
        assertEquals("我的老师很好。", res.getCorrectAnswer());
    }

    @Test
    @DisplayName("Sentence ordering attempt bỏ qua dấu câu và khoảng trắng khi so khớp")
    void testAttemptExercise_sentenceOrderingMatches() {
        Exercise exercise = Exercise.builder()
                .id(101L)
                .exerciseType(ExerciseType.SENTENCE_ORDERING)
                .vocabulary(mockVocab)
                .example(mockExample)
                .build();

        SentenceOrderingExercise so = SentenceOrderingExercise.builder()
                .id(201L)
                .exercise(exercise)
                .tokens(List.of(
                        SentenceOrderingToken.builder().token("老师").position(0).build(),
                        SentenceOrderingToken.builder().token("再见").position(1).build()
                ))
                .build();

        when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
        when(exerciseRepository.findById(101L)).thenReturn(Optional.of(exercise));
        when(sentenceOrderingExerciseRepository.findByExerciseIdWithTokens(101L)).thenReturn(Optional.of(so));

        // Người dùng ghép đúng các token
        ExerciseAttemptRequest req = ExerciseAttemptRequest.builder()
                .userAnswer("老师 再见")
                .timeSpentSecs(8)
                .build();

        ExerciseAttemptResponse res = exerciseService.attemptExercise(mockUser.getId(), 101L, req);

        assertTrue(res.isCorrect(), "Ghép đúng các token theo thứ tự phải được tính là ĐÚNG");
    }

    @Test
    @DisplayName("Fill blank attempt so sánh chuỗi trim và không phân biệt hoa thường")
    void testAttemptExercise_fillBlankMatches() {
        Exercise exercise = Exercise.builder()
                .id(102L)
                .exerciseType(ExerciseType.FILL_BLANK)
                .vocabulary(mockVocab)
                .example(mockExample)
                .build();

        FillBlankExercise fb = FillBlankExercise.builder()
                .id(202L)
                .exercise(exercise)
                .blankText("我的____很好。")
                .answer("老师")
                .build();

        when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
        when(exerciseRepository.findById(102L)).thenReturn(Optional.of(exercise));
        when(fillBlankExerciseRepository.findByExerciseId(102L)).thenReturn(Optional.of(fb));

        ExerciseAttemptRequest req = ExerciseAttemptRequest.builder()
                .userAnswer("  老师  ")
                .timeSpentSecs(3)
                .build();

        ExerciseAttemptResponse res = exerciseService.attemptExercise(mockUser.getId(), 102L, req);

        assertTrue(res.isCorrect(), "Điền đúng từ có khoảng trắng thừa đầu cuối vẫn phải là ĐÚNG");
    }
}
