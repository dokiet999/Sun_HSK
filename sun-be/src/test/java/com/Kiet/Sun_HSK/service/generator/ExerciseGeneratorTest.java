package com.Kiet.Sun_HSK.service.generator;

import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import com.Kiet.Sun_HSK.repository.*;
import com.Kiet.Sun_HSK.service.strategy.CharacterLevelTokenizationStrategy;
import com.Kiet.Sun_HSK.service.strategy.DictionaryBasedTokenizationStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExerciseGeneratorTest {

    @Mock
    private ExerciseRepository exerciseRepository;

    @Mock
    private FillBlankExerciseRepository fillBlankExerciseRepository;

    @Mock
    private SentenceOrderingExerciseRepository sentenceOrderingExerciseRepository;

    @Mock
    private SentenceOrderingTokenRepository sentenceOrderingTokenRepository;

    @Mock
    private ListeningExerciseRepository listeningExerciseRepository;

    @Mock
    private VocabularyRepository vocabularyRepository;

    private DictionaryBasedTokenizationStrategy tokenizationStrategy;
    private FillBlankGenerator fillBlankGenerator;
    private SentenceOrderingGenerator sentenceOrderingGenerator;
    private ListeningGenerator listeningGenerator;

    private Vocabulary vocabTeacher;
    private VocabularyExample exampleTeacher;

    @BeforeEach
    void setUp() {
        CharacterLevelTokenizationStrategy charFallback = new CharacterLevelTokenizationStrategy();
        tokenizationStrategy = new DictionaryBasedTokenizationStrategy(vocabularyRepository, charFallback);

        fillBlankGenerator = new FillBlankGenerator(exerciseRepository, fillBlankExerciseRepository);
        sentenceOrderingGenerator = new SentenceOrderingGenerator(
                exerciseRepository,
                sentenceOrderingExerciseRepository,
                sentenceOrderingTokenRepository,
                tokenizationStrategy
        );
        listeningGenerator = new ListeningGenerator(exerciseRepository, listeningExerciseRepository);

        vocabTeacher = Vocabulary.builder()
                .id(1L)
                .hskLevel(1)
                .hanzi("老师")
                .pinyin("lǎoshī")
                .meaningVi("giáo viên")
                .audioPath("words/1.mp3")
                .build();

        exampleTeacher = VocabularyExample.builder()
                .id(10L)
                .vocabulary(vocabTeacher)
                .zh("我的老师很好。")
                .vi("Giáo viên của tôi rất tốt.")
                .audioPath("examples/10.mp3")
                .build();
    }

    @Test
    @DisplayName("Tokenize không chứa dấu câu và giữ nguyên từ vựng HSK")
    void testDictionaryTokenization_preservesWordsAndRemovesPunctuation() {
        when(vocabularyRepository.findByHskLevelOrderBySortOrderAsc(1)).thenReturn(List.of(
                Vocabulary.builder().hanzi("老师").build(),
                Vocabulary.builder().hanzi("我").build(),
                Vocabulary.builder().hanzi("的").build(),
                Vocabulary.builder().hanzi("很").build(),
                Vocabulary.builder().hanzi("好").build(),
                Vocabulary.builder().hanzi("再见").build()
        ));

        List<String> tokens1 = tokenizationStrategy.tokenize("我的老师很好。", 1);
        assertEquals(List.of("我", "의", "老师", "很", "好").size(), tokens1.size());
        assertEquals("我", tokens1.get(0));
        assertEquals("的", tokens1.get(1));
        assertEquals("老师", tokens1.get(2));
        assertFalse(tokens1.contains("。"), "Không được chứa dấu chấm 。 trong tokens");

        List<String> tokens2 = tokenizationStrategy.tokenize("老师，再见！", 1);
        assertEquals(List.of("老师", "再见"), tokens2);
        assertFalse(tokens2.contains("，"), "Không được chứa dấu phẩy ， trong tokens");
        assertFalse(tokens2.contains("！"), "Không được chứa dấu chấm than ！ trong tokens");
    }

    @Test
    @DisplayName("FillBlankGenerator sinh bài tập điền từ chính xác")
    void testFillBlankGenerator_success() {
        when(exerciseRepository.save(any(Exercise.class))).thenAnswer(inv -> {
            Exercise e = inv.getArgument(0);
            e.setId(100L);
            return e;
        });

        when(fillBlankExerciseRepository.save(any(FillBlankExercise.class))).thenAnswer(inv -> {
            FillBlankExercise fb = inv.getArgument(0);
            fb.setId(200L);
            return fb;
        });

        Optional<FillBlankExercise> result = fillBlankGenerator.generate(vocabTeacher, exampleTeacher);

        assertTrue(result.isPresent());
        FillBlankExercise fb = result.get();
        assertEquals("我的____很好。", fb.getBlankText());
        assertEquals("老师", fb.getAnswer());
        assertEquals(ExerciseType.FILL_BLANK, fb.getExercise().getExerciseType());
    }

    @Test
    @DisplayName("FillBlankGenerator hỗ trợ từ có ngoặc đơn tùy chọn")
    void testFillBlankGenerator_parenthesesVariant() {
        Vocabulary vocabChadianr = Vocabulary.builder()
                .id(2L)
                .hskLevel(3)
                .hanzi("差（一）点儿")
                .pinyin("chà(yì)diǎnr")
                .meaningVi("suýt nữa")
                .build();

        VocabularyExample exampleChadianr = VocabularyExample.builder()
                .id(20L)
                .vocabulary(vocabChadianr)
                .zh("我差一点儿就迟到了。")
                .vi("Tôi suýt nữa thì đi muộn.")
                .build();

        when(exerciseRepository.save(any(Exercise.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fillBlankExerciseRepository.save(any(FillBlankExercise.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<FillBlankExercise> result = fillBlankGenerator.generate(vocabChadianr, exampleChadianr);

        assertTrue(result.isPresent());
        assertEquals("我____就迟到了。", result.get().getBlankText());
        assertEquals("差一点儿", result.get().getAnswer());
    }

    @Test
    @DisplayName("SentenceOrderingGenerator sinh tokens đúng thứ tự và không bị lẫn dấu câu")
    void testSentenceOrderingGenerator_success() {
        when(vocabularyRepository.findByHskLevelOrderBySortOrderAsc(1)).thenReturn(List.of(
                Vocabulary.builder().hanzi("老师").build(),
                Vocabulary.builder().hanzi("再见").build()
        ));

        when(exerciseRepository.save(any(Exercise.class))).thenAnswer(inv -> {
            Exercise e = inv.getArgument(0);
            e.setId(101L);
            return e;
        });

        when(sentenceOrderingExerciseRepository.save(any(SentenceOrderingExercise.class))).thenAnswer(inv -> {
            SentenceOrderingExercise so = inv.getArgument(0);
            so.setId(201L);
            return so;
        });

        VocabularyExample exGoodbye = VocabularyExample.builder()
                .id(30L)
                .vocabulary(vocabTeacher)
                .zh("老师，再见！")
                .vi("Tạm biệt thầy cô!")
                .build();

        Optional<SentenceOrderingExercise> result = sentenceOrderingGenerator.generate(vocabTeacher, exGoodbye);

        assertTrue(result.isPresent());
        SentenceOrderingExercise so = result.get();
        assertEquals(2, so.getTokens().size());
        assertEquals("老师", so.getTokens().get(0).getToken());
        assertEquals("再见", so.getTokens().get(1).getToken());
        verify(sentenceOrderingTokenRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("SentenceOrderingGenerator bỏ qua câu chỉ có 1 token")
    void testSentenceOrderingGenerator_skipTooShort() {
        when(vocabularyRepository.findByHskLevelOrderBySortOrderAsc(1)).thenReturn(List.of(
                Vocabulary.builder().hanzi("你好").build()
        ));

        VocabularyExample exNihao = VocabularyExample.builder()
                .id(40L)
                .vocabulary(vocabTeacher)
                .zh("你好！")
                .vi("Xin chào!")
                .build();

        Optional<SentenceOrderingExercise> result = sentenceOrderingGenerator.generate(vocabTeacher, exNihao);
        assertTrue(result.isEmpty(), "Câu chỉ có 1 token không được sinh bài sắp xếp câu");
    }

    @Test
    @DisplayName("ListeningGenerator sinh bài tập nghe chính xác")
    void testListeningGenerator_success() {
        when(exerciseRepository.save(any(Exercise.class))).thenAnswer(inv -> {
            Exercise e = inv.getArgument(0);
            e.setId(102L);
            return e;
        });

        when(listeningExerciseRepository.save(any(ListeningExercise.class))).thenAnswer(inv -> {
            ListeningExercise l = inv.getArgument(0);
            l.setId(202L);
            return l;
        });

        Optional<ListeningExercise> result = listeningGenerator.generate(vocabTeacher, exampleTeacher);

        assertTrue(result.isPresent());
        ListeningExercise l = result.get();
        assertEquals(ExerciseType.LISTENING, l.getExercise().getExerciseType());
        assertEquals("examples/10.mp3", l.getAudioPath());
    }
}
