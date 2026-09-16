package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.response.LessonOverviewResponse;
import com.Kiet.Sun_HSK.dto.response.LessonVocabularyResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.entity.UserVocabulary;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.entity.VocabularyCollocation;
import com.Kiet.Sun_HSK.entity.VocabularyExample;
import com.Kiet.Sun_HSK.enums.VocabularyLearningStatus;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.UserVocabularyRepository;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
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
class VocabularyServiceTest {

    @Mock
    private VocabularyRepository vocabularyRepository;

    @Mock
    private UserVocabularyRepository userVocabularyRepository;

    @InjectMocks
    private VocabularyService vocabularyService;

    private UUID mockUserId;
    private User mockUser;
    private Vocabulary vocab1;
    private Vocabulary vocab2;
    private UserVocabulary userVocab1;

    @BeforeEach
    void setUp() {
        mockUserId = UUID.randomUUID();
        mockUser = User.builder().id(mockUserId).email("student@sunhsk.com").build();

        VocabularyCollocation collocation = VocabularyCollocation.builder()
                .id(1L)
                .text("你好吗")
                .meaningVi("bạn khỏe không")
                .build();

        VocabularyExample example = VocabularyExample.builder()
                .id(1L)
                .zh("你好！很高兴认识你。")
                .vi("Xin chào! Rất vui được gặp bạn.")
                .audioPath("examples/1_0.mp3")
                .sortOrder(1)
                .build();

        Set<VocabularyCollocation> collocations = new LinkedHashSet<>();
        collocations.add(collocation);

        Set<VocabularyExample> examples = new LinkedHashSet<>();
        examples.add(example);

        vocab1 = Vocabulary.builder()
                .id(1L)
                .hskLevel(1)
                .lessonNumber(1)
                .position(0)
                .hanzi("你好")
                .pinyin("nǐ hǎo")
                .hanViet("nhĩ hảo")
                .pos("Thán từ")
                .meaningVi("xin chào")
                .meaningEn("hello")
                .audioPath("words/1.mp3")
                .sortOrder(0)
                .defaultInReviewList(false)
                .shuffleRank(1.0)
                .collocations(collocations)
                .examples(examples)
                .build();

        vocab2 = Vocabulary.builder()
                .id(2L)
                .hskLevel(1)
                .lessonNumber(1)
                .position(1)
                .hanzi("谢谢")
                .pinyin("xièxie")
                .hanViet("tạ tạ")
                .pos("Động từ")
                .meaningVi("cảm ơn")
                .meaningEn("thank you")
                .audioPath("words/2.mp3")
                .sortOrder(1)
                .defaultInReviewList(false)
                .shuffleRank(2.0)
                .collocations(new LinkedHashSet<>())
                .examples(new LinkedHashSet<>())
                .build();

        userVocab1 = UserVocabulary.builder()
                .id(100L)
                .user(mockUser)
                .vocabulary(vocab1)
                .status(VocabularyLearningStatus.LEARNING)
                .inReviewList(true)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. getByLevel Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getByLevel - Khách chưa đăng nhập (userId == null) trả về danh sách từ vựng với userStatus null")
    void getByLevel_GuestUser_Success() {
        when(vocabularyRepository.findByHskLevelAndHskVersionWithDetails(1, null)).thenReturn(List.of(vocab1, vocab2));

        List<VocabularyResponse> result = vocabularyService.getByLevel(1, null);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("你好", result.get(0).getHanzi());
        assertNull(result.get(0).getUserStatus());
        assertFalse(result.get(0).getInReviewList());
        assertEquals("谢谢", result.get(1).getHanzi());

        verify(vocabularyRepository, times(1)).findByHskLevelAndHskVersionWithDetails(1, null);
        verifyNoInteractions(userVocabularyRepository);
    }

    @Test
    @DisplayName("getByLevel - Người dùng đã đăng nhập (userId != null) trả về kèm trạng thái học tập và ghim review")
    void getByLevel_LoggedInUser_Success() {
        when(vocabularyRepository.findByHskLevelAndHskVersionWithDetails(1, null)).thenReturn(List.of(vocab1, vocab2));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 1L)).thenReturn(Optional.of(userVocab1));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 2L)).thenReturn(Optional.empty());

        List<VocabularyResponse> result = vocabularyService.getByLevel(1, mockUserId);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("你好", result.get(0).getHanzi());
        assertEquals(VocabularyLearningStatus.LEARNING, result.get(0).getUserStatus());
        assertTrue(result.get(0).getInReviewList());

        assertEquals("谢谢", result.get(1).getHanzi());
        assertNull(result.get(1).getUserStatus());
        assertFalse(result.get(1).getInReviewList());

        verify(vocabularyRepository, times(1)).findByHskLevelAndHskVersionWithDetails(1, null);
        verify(userVocabularyRepository, times(1)).findByUserIdAndVocabularyId(mockUserId, 1L);
        verify(userVocabularyRepository, times(1)).findByUserIdAndVocabularyId(mockUserId, 2L);
    }

    @Test
    @DisplayName("getByLevel - Cấp độ không có từ nào trả về danh sách rỗng")
    void getByLevel_EmptyList() {
        when(vocabularyRepository.findByHskLevelAndHskVersionWithDetails(6, null)).thenReturn(Collections.emptyList());

        List<VocabularyResponse> result = vocabularyService.getByLevel(6, null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(vocabularyRepository, times(1)).findByHskLevelAndHskVersionWithDetails(6, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. getById Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getById - Tìm thấy từ vựng hợp lệ khi chưa đăng nhập")
    void getById_Success_GuestUser() {
        when(vocabularyRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(vocab1));

        VocabularyResponse result = vocabularyService.getById(1L, null);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("你好", result.getHanzi());
        assertEquals("xin chào", result.getMeaningVi());
        assertNull(result.getUserStatus());
        assertFalse(result.getInReviewList());
        assertEquals(1, result.getCollocations().size());
        assertEquals("你好吗", result.getCollocations().get(0).getText());
        assertEquals(1, result.getExamples().size());
        assertEquals("你好！很高兴认识你。", result.getExamples().get(0).getZh());

        verify(vocabularyRepository, times(1)).findByIdWithDetails(1L);
        verifyNoInteractions(userVocabularyRepository);
    }

    @Test
    @DisplayName("getById - Tìm thấy từ vựng khi người dùng đã đăng nhập và có dữ liệu UserVocabulary")
    void getById_Success_LoggedInUser() {
        when(vocabularyRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(vocab1));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 1L)).thenReturn(Optional.of(userVocab1));

        VocabularyResponse result = vocabularyService.getById(1L, mockUserId);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(VocabularyLearningStatus.LEARNING, result.getUserStatus());
        assertTrue(result.getInReviewList());

        verify(vocabularyRepository, times(1)).findByIdWithDetails(1L);
        verify(userVocabularyRepository, times(1)).findByUserIdAndVocabularyId(mockUserId, 1L);
    }

    @Test
    @DisplayName("getById - Không tìm thấy từ vựng ném ra AppException(VOCABULARY_NOT_FOUND)")
    void getById_NotFound_ThrowsException() {
        when(vocabularyRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> vocabularyService.getById(999L, mockUserId));

        assertEquals(ErrorCode.VOCABULARY_NOT_FOUND, ex.getErrorCode());
        verify(vocabularyRepository, times(1)).findByIdWithDetails(999L);
        verifyNoInteractions(userVocabularyRepository);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. getLessonOverview Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getLessonOverview - Có sẵn distinctLessons: Tính toán bài học, tiến độ và hoàn thành cho user")
    void getLessonOverview_WithDistinctLessons_LoggedInUser() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1, 2));

        // Mock dữ liệu trạng thái của user cho level 1
        List<Object[]> statusRows = new ArrayList<>();
        statusRows.add(new Object[]{1L, VocabularyLearningStatus.MASTERED});
        statusRows.add(new Object[]{2L, VocabularyLearningStatus.LEARNING});
        statusRows.add(new Object[]{3L, VocabularyLearningStatus.NEW});
        when(userVocabularyRepository.findStatusMapByUserIdAndLevelAndVersion(mockUserId, 1, null)).thenReturn(statusRows);

        when(vocabularyRepository.findIdsByHskLevelAndLessonNumberAndHskVersion(1, 1, null)).thenReturn(List.of(1L, 2L));
        when(vocabularyRepository.findIdsByHskLevelAndLessonNumberAndHskVersion(1, 2, null)).thenReturn(List.of(3L, 4L));

        LessonOverviewResponse response = vocabularyService.getLessonOverview(1, 10, mockUserId);

        assertNotNull(response);
        assertEquals(1, response.getLevel());
        assertEquals(4, response.getTotalWords());
        assertEquals(2, response.getTotalLessons());
        assertEquals(2, response.getLessons().size());

        // Bài 1: từ 1L (MASTERED), 2L (LEARNING) -> 2 learned, 1 mastered -> 100% complete
        var lesson1 = response.getLessons().get(0);
        assertEquals(1, lesson1.getLessonNumber());
        assertEquals(2, lesson1.getTotalWords());
        assertEquals(2, lesson1.getLearnedWords());
        assertEquals(1, lesson1.getMasteredWords());
        assertEquals(100.0, lesson1.getProgressPercent());
        assertTrue(lesson1.isCompleted());

        // Bài 2: từ 3L (NEW), 4L (chưa học) -> 0 learned, 0 mastered -> 0%
        var lesson2 = response.getLessons().get(1);
        assertEquals(2, lesson2.getLessonNumber());
        assertEquals(2, lesson2.getTotalWords());
        assertEquals(0, lesson2.getLearnedWords());
        assertEquals(0, lesson2.getMasteredWords());
        assertEquals(0.0, lesson2.getProgressPercent());
        assertFalse(lesson2.isCompleted());
    }

    @Test
    @DisplayName("getLessonOverview - Có sẵn distinctLessons: Khách chưa đăng nhập (userId == null)")
    void getLessonOverview_WithDistinctLessons_GuestUser() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1));
        when(vocabularyRepository.findIdsByHskLevelAndLessonNumberAndHskVersion(1, 1, null)).thenReturn(List.of(1L, 2L));

        LessonOverviewResponse response = vocabularyService.getLessonOverview(1, 10, null);

        assertNotNull(response);
        assertEquals(1, response.getTotalLessons());
        assertEquals(2, response.getTotalWords());
        assertEquals(0, response.getLessons().get(0).getLearnedWords());
        assertFalse(response.getLessons().get(0).isCompleted());

        verifyNoInteractions(userVocabularyRepository);
    }

    @Test
    @DisplayName("getLessonOverview - Fallback khi không có distinctLessons (chia bài theo pageSize)")
    void getLessonOverview_FallbackAllIds_Success() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(Collections.emptyList());
        when(vocabularyRepository.findIdsByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1L, 2L, 3L, 4L, 5L));

        // pageSize <= 0 sẽ tự fallback về 10, ở đây truyền 2 -> 3 bài (2 + 2 + 1)
        LessonOverviewResponse response = vocabularyService.getLessonOverview(1, 2, null);

        assertNotNull(response);
        assertEquals(1, response.getLevel());
        assertEquals(5, response.getTotalWords());
        assertEquals(3, response.getTotalLessons());
        assertEquals(3, response.getLessons().size());

        assertEquals(2, response.getLessons().get(0).getTotalWords());
        assertEquals(2, response.getLessons().get(1).getTotalWords());
        assertEquals(1, response.getLessons().get(2).getTotalWords());
    }

    @Test
    @DisplayName("getLessonOverview - Fallback khi pageSize <= 0 sẽ tự gán mặc định bằng 10")
    void getLessonOverview_FallbackAllIds_InvalidPageSize() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(Collections.emptyList());
        when(vocabularyRepository.findIdsByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1L, 2L));

        LessonOverviewResponse response = vocabularyService.getLessonOverview(1, -5, null);

        assertNotNull(response);
        assertEquals(10, response.getWordsPerLesson());
        assertEquals(1, response.getTotalLessons());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. getWordsByLesson Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getWordsByLesson - Có distinctLessons: Lấy chi tiết từ vựng theo số bài học khi đã đăng nhập")
    void getWordsByLesson_WithDistinctLessons_LoggedInUser() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1, 2));
        when(vocabularyRepository.findIdsByHskLevelAndLessonNumberAndHskVersion(1, 1, null)).thenReturn(List.of(1L, 2L));
        when(vocabularyRepository.findByIdsWithDetails(List.of(1L, 2L))).thenReturn(List.of(vocab1, vocab2));
        when(userVocabularyRepository.findByUserIdAndVocabularyIdIn(mockUserId, List.of(1L, 2L)))
                .thenReturn(List.of(userVocab1));

        LessonVocabularyResponse response = vocabularyService.getWordsByLesson(1, 1, 10, mockUserId);

        assertNotNull(response);
        assertEquals(1, response.getLevel());
        assertEquals(1, response.getLessonNumber());
        assertEquals(2, response.getTotalLessons());
        assertEquals(2, response.getTotalWordsInLesson());
        assertEquals(2, response.getWords().size());
        assertEquals("你好", response.getWords().get(0).getHanzi());
        assertEquals(VocabularyLearningStatus.LEARNING, response.getWords().get(0).getUserStatus());
        assertTrue(response.getWords().get(0).getInReviewList());

        assertEquals("谢谢", response.getWords().get(1).getHanzi());
        assertNull(response.getWords().get(1).getUserStatus());
        assertFalse(response.getWords().get(1).getInReviewList());
    }

    @Test
    @DisplayName("getWordsByLesson - Có distinctLessons nhưng danh sách ID rỗng trả về words rỗng")
    void getWordsByLesson_EmptyLessonIds() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1));
        when(vocabularyRepository.findIdsByHskLevelAndLessonNumberAndHskVersion(1, 1, null)).thenReturn(Collections.emptyList());

        LessonVocabularyResponse response = vocabularyService.getWordsByLesson(1, 1, 10, null);

        assertNotNull(response);
        assertEquals(0, response.getTotalWordsInLesson());
        assertTrue(response.getWords().isEmpty());
        verify(vocabularyRepository, never()).findByIdsWithDetails(anyList());
    }

    @Test
    @DisplayName("getWordsByLesson - Fallback khi không có distinctLessons và start >= allIds.size()")
    void getWordsByLesson_FallbackAllIds_StartBeyondSize() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(Collections.emptyList());
        when(vocabularyRepository.findIdsByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1L, 2L));

        // lessonNumber = 5, pageSize = 10 -> start = 40 >= 2
        LessonVocabularyResponse response = vocabularyService.getWordsByLesson(1, 5, 10, null);

        assertNotNull(response);
        assertEquals(0, response.getTotalWordsInLesson());
        assertTrue(response.getWords().isEmpty());
    }

    @Test
    @DisplayName("getWordsByLesson - Chuẩn hóa tham số pageSize <= 0 và lessonNumber < 1")
    void getWordsByLesson_NormalizeParams() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1));
        when(vocabularyRepository.findIdsByHskLevelAndLessonNumberAndHskVersion(1, 1, null)).thenReturn(List.of(1L));
        when(vocabularyRepository.findByIdsWithDetails(List.of(1L))).thenReturn(List.of(vocab1));

        LessonVocabularyResponse response = vocabularyService.getWordsByLesson(1, -1, -5, null);

        assertNotNull(response);
        assertEquals(1, response.getLessonNumber());
        assertEquals(1, response.getTotalWordsInLesson());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. getLessonWordIds Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getLessonWordIds - Có distinctLessons trả về ID theo bài học")
    void getLessonWordIds_WithDistinctLessons() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1, 2));
        when(vocabularyRepository.findIdsByHskLevelAndLessonNumberAndHskVersion(1, 1, null)).thenReturn(List.of(1L, 2L));

        List<Long> result = vocabularyService.getLessonWordIds(1, 1, 10);

        assertEquals(List.of(1L, 2L), result);
        verify(vocabularyRepository, times(1)).findIdsByHskLevelAndLessonNumberAndHskVersion(1, 1, null);
    }

    @Test
    @DisplayName("getLessonWordIds - Fallback khi không có distinctLessons")
    void getLessonWordIds_FallbackAllIds_Success() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(Collections.emptyList());
        when(vocabularyRepository.findIdsByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1L, 2L, 3L, 4L, 5L));

        // lesson 2, pageSize 2 -> start = 2, end = 4 -> [3L, 4L]
        List<Long> result = vocabularyService.getLessonWordIds(1, 2, 2);

        assertEquals(List.of(3L, 4L), result);
    }

    @Test
    @DisplayName("getLessonWordIds - Fallback khi start >= allIds.size() trả về danh sách rỗng")
    void getLessonWordIds_FallbackAllIds_OutOfBounds() {
        when(vocabularyRepository.findDistinctLessonNumbersByHskLevelAndHskVersion(1, null)).thenReturn(Collections.emptyList());
        when(vocabularyRepository.findIdsByHskLevelAndHskVersion(1, null)).thenReturn(List.of(1L, 2L));

        List<Long> result = vocabularyService.getLessonWordIds(1, 10, 10);

        assertTrue(result.isEmpty());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. mapToResponse Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("mapToResponse - Mapping đầy đủ Collocations, Examples và UserVocabulary")
    void mapToResponse_FullDetails() {
        VocabularyResponse response = vocabularyService.mapToResponse(vocab1, userVocab1);

        assertNotNull(response);
        assertEquals(vocab1.getId(), response.getId());
        assertEquals(vocab1.getHskLevel(), response.getHskLevel());
        assertEquals(vocab1.getHanzi(), response.getHanzi());
        assertEquals(vocab1.getPinyin(), response.getPinyin());
        assertEquals(vocab1.getMeaningVi(), response.getMeaningVi());
        assertEquals(1, response.getCollocations().size());
        assertEquals("你好吗", response.getCollocations().get(0).getText());
        assertEquals(1, response.getExamples().size());
        assertEquals("你好！很高兴认识你。", response.getExamples().get(0).getZh());
        assertEquals(VocabularyLearningStatus.LEARNING, response.getUserStatus());
        assertTrue(response.getInReviewList());
    }

    @Test
    @DisplayName("mapToResponse - Collocations và Examples là null chuyển về danh sách rỗng, userVocab null trả về mặc định")
    void mapToResponse_NullCollocationsAndExamples_ReturnsEmptyLists() {
        Vocabulary bareVocab = Vocabulary.builder()
                .id(99L)
                .hskLevel(2)
                .hanzi("水")
                .pinyin("shuǐ")
                .meaningVi("nước")
                .collocations(null)
                .examples(null)
                .build();

        VocabularyResponse response = vocabularyService.mapToResponse(bareVocab, null);

        assertNotNull(response);
        assertNotNull(response.getCollocations());
        assertTrue(response.getCollocations().isEmpty());
        assertNotNull(response.getExamples());
        assertTrue(response.getExamples().isEmpty());
        assertNull(response.getUserStatus());
        assertFalse(response.getInReviewList());
    }

    @Test
    @DisplayName("mapToResponse - userVocab có inReviewList là null thì mặc định trả về false")
    void mapToResponse_NullInReviewListInUserVocab() {
        UserVocabulary uv = UserVocabulary.builder()
                .id(200L)
                .status(VocabularyLearningStatus.MASTERED)
                .inReviewList(null)
                .build();

        VocabularyResponse response = vocabularyService.mapToResponse(vocab2, uv);

        assertNotNull(response);
        assertEquals(VocabularyLearningStatus.MASTERED, response.getUserStatus());
        assertFalse(response.getInReviewList());
    }
}
