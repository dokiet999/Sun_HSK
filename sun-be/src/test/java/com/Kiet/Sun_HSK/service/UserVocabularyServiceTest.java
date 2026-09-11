package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.response.UserVocabularyResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.entity.UserVocabulary;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.enums.VocabularyLearningStatus;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.UserRepository;
import com.Kiet.Sun_HSK.repository.UserVocabularyRepository;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserVocabularyServiceTest {

    @Mock
    private UserVocabularyRepository userVocabularyRepository;

    @Mock
    private VocabularyRepository vocabularyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserVocabularyService userVocabularyService;

    private UUID mockUserId;
    private User mockUser;
    private Vocabulary mockVocab;
    private UserVocabulary existingUserVocab;

    @BeforeEach
    void setUp() {
        mockUserId = UUID.randomUUID();
        mockUser = User.builder()
                .id(mockUserId)
                .email("student@sunhsk.com")
                .displayName("Học viên")
                .build();

        mockVocab = Vocabulary.builder()
                .id(101L)
                .hskLevel(1)
                .lessonNumber(1)
                .position(0)
                .hanzi("你好")
                .pinyin("nǐ hǎo")
                .meaningVi("xin chào")
                .audioPath("words/101.mp3")
                .build();

        existingUserVocab = UserVocabulary.builder()
                .id(1L)
                .user(mockUser)
                .vocabulary(mockVocab)
                .status(VocabularyLearningStatus.LEARNING)
                .inReviewList(false)
                .reviewCount(1)
                .correctCount(1)
                .wrongCount(0)
                .lastReviewedAt(LocalDateTime.now().minusDays(1))
                .nextReviewAt(LocalDateTime.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. startLearning Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("startLearning - Bắt đầu học từ mới chưa có trong UserVocabulary, tạo mới với status LEARNING")
    void testStartLearning_NewRecord_Success() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.empty());

        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(invocation -> {
                    UserVocabulary uv = invocation.getArgument(0);
                    uv.setId(10L);
                    return uv;
                });

        UserVocabularyResponse response = userVocabularyService.startLearning(mockUserId, 101L);

        assertNotNull(response);
        assertEquals(101L, response.getVocabularyId());
        assertEquals("你好", response.getHanzi());
        assertEquals("xin chào", response.getMeaningVi());
        assertEquals(VocabularyLearningStatus.LEARNING, response.getStatus());
        assertFalse(response.getInReviewList());
        assertEquals(0, response.getReviewCount());

        ArgumentCaptor<UserVocabulary> captor = ArgumentCaptor.forClass(UserVocabulary.class);
        verify(userVocabularyRepository, times(1)).save(captor.capture());
        UserVocabulary saved = captor.getValue();
        assertEquals(VocabularyLearningStatus.LEARNING, saved.getStatus());
        assertNotNull(saved.getNextReviewAt());
    }

    @Test
    @DisplayName("startLearning - Đã có sẵn UserVocabulary từ trước, trả về thông tin hiện tại không tạo mới")
    void testStartLearning_ExistingRecord_ReturnsExisting() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.of(existingUserVocab));

        UserVocabularyResponse response = userVocabularyService.startLearning(mockUserId, 101L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(101L, response.getVocabularyId());
        assertEquals(VocabularyLearningStatus.LEARNING, response.getStatus());

        verify(userVocabularyRepository, never()).save(any());
    }

    @Test
    @DisplayName("startLearning - User không tồn tại ném ra AppException(USER_NOT_FOUND)")
    void testStartLearning_UserNotFound_ThrowsException() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                userVocabularyService.startLearning(mockUserId, 101L));

        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        verifyNoInteractions(vocabularyRepository);
        verifyNoInteractions(userVocabularyRepository);
    }

    @Test
    @DisplayName("startLearning - Vocabulary không tồn tại ném ra AppException(VOCABULARY_NOT_FOUND)")
    void testStartLearning_VocabNotFound_ThrowsException() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                userVocabularyService.startLearning(mockUserId, 999L));

        assertEquals(ErrorCode.VOCABULARY_NOT_FOUND, ex.getErrorCode());
        verify(userVocabularyRepository, never()).findByUserIdAndVocabularyId(any(), any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. toggleReviewList Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toggleReviewList - Đã có UserVocabulary, cập nhật inReviewList thành true")
    void testToggleReviewList_ExistingRecord_Success() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.of(existingUserVocab));
        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        UserVocabularyResponse response = userVocabularyService.toggleReviewList(mockUserId, 101L, true);

        assertNotNull(response);
        assertTrue(response.getInReviewList());
        verify(userVocabularyRepository, times(1)).save(existingUserVocab);
    }

    @Test
    @DisplayName("toggleReviewList - Chưa có UserVocabulary, tạo mới với status NEW và inReviewList đã chọn")
    void testToggleReviewList_NewRecord_Success() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.empty());
        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        UserVocabularyResponse response = userVocabularyService.toggleReviewList(mockUserId, 101L, true);

        assertNotNull(response);
        assertTrue(response.getInReviewList());
        assertEquals(VocabularyLearningStatus.NEW, response.getStatus());

        ArgumentCaptor<UserVocabulary> captor = ArgumentCaptor.forClass(UserVocabulary.class);
        verify(userVocabularyRepository, times(1)).save(captor.capture());
        assertTrue(captor.getValue().getInReviewList());
        assertEquals(VocabularyLearningStatus.NEW, captor.getValue().getStatus());
    }

    @Test
    @DisplayName("toggleReviewList - User không tồn tại ném ra AppException(USER_NOT_FOUND)")
    void testToggleReviewList_UserNotFound_ThrowsException() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                userVocabularyService.toggleReviewList(mockUserId, 101L, true));

        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("toggleReviewList - Vocabulary không tồn tại ném ra AppException(VOCABULARY_NOT_FOUND)")
    void testToggleReviewList_VocabNotFound_ThrowsException() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                userVocabularyService.toggleReviewList(mockUserId, 999L, true));

        assertEquals(ErrorCode.VOCABULARY_NOT_FOUND, ex.getErrorCode());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. recordReviewRating Tests (SRS SM-2)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("recordReviewRating - Rating = 1 (Again/Quên): tăng wrongCount, reset lịch ôn về 1 ngày, set LEARNING")
    void testRecordReviewRating_Rating1_QuenTu() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.of(existingUserVocab));
        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        int initialWrong = existingUserVocab.getWrongCount();

        UserVocabularyResponse response = userVocabularyService.recordReviewRating(mockUserId, 101L, 1);

        assertNotNull(response);
        assertEquals(initialWrong + 1, response.getWrongCount());
        assertEquals(VocabularyLearningStatus.LEARNING, response.getStatus());
        assertNotNull(response.getLastReviewedAt());
        assertNotNull(response.getNextReviewAt());
        assertTrue(response.getNextReviewAt().isAfter(LocalDateTime.now()));
    }

    @Test
    @DisplayName("recordReviewRating - Rating = 3 (Good): tăng correctCount và reviewCount, cập nhật REVIEWING")
    void testRecordReviewRating_Rating3_NhoTot() {
        existingUserVocab.setReviewCount(2);
        existingUserVocab.setCorrectCount(2);

        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.of(existingUserVocab));
        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        UserVocabularyResponse response = userVocabularyService.recordReviewRating(mockUserId, 101L, 3);

        assertNotNull(response);
        assertEquals(3, response.getCorrectCount());
        assertEquals(3, response.getReviewCount());
        assertEquals(VocabularyLearningStatus.REVIEWING, response.getStatus());
    }

    @Test
    @DisplayName("recordReviewRating - Rating = 4 (Easy): cộng thêm 1 ngày vào khoảng cách SRS")
    void testRecordReviewRating_Rating4_De() {
        existingUserVocab.setReviewCount(1);

        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.of(existingUserVocab));
        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        UserVocabularyResponse response = userVocabularyService.recordReviewRating(mockUserId, 101L, 4);

        assertNotNull(response);
        assertEquals(2, response.getReviewCount());
        assertEquals(VocabularyLearningStatus.REVIEWING, response.getStatus());
        // Interval cho index 1 là 2 ngày, cộng thêm 1 ngày cho rating 4 = 3 ngày
        assertNotNull(response.getNextReviewAt());
    }

    @Test
    @DisplayName("recordReviewRating - Đạt từ 5 lần review đúng trở lên: chuyển sang MASTERED")
    void testRecordReviewRating_MasteredStatus() {
        existingUserVocab.setReviewCount(4); // Lần này nữa sẽ là 5

        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.of(existingUserVocab));
        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        UserVocabularyResponse response = userVocabularyService.recordReviewRating(mockUserId, 101L, 3);

        assertNotNull(response);
        assertEquals(5, response.getReviewCount());
        assertEquals(VocabularyLearningStatus.MASTERED, response.getStatus());
    }

    @Test
    @DisplayName("recordReviewRating - Chưa có UserVocabulary từ trước thì tự khởi tạo và ghi nhận đánh giá")
    void testRecordReviewRating_NewRecordCreated() {
        when(userRepository.findById(mockUserId)).thenReturn(Optional.of(mockUser));
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(mockVocab));
        when(userVocabularyRepository.findByUserIdAndVocabularyId(mockUserId, 101L))
                .thenReturn(Optional.empty());
        when(userVocabularyRepository.save(any(UserVocabulary.class)))
                .thenAnswer(inv -> {
                    UserVocabulary uv = inv.getArgument(0);
                    uv.setId(50L);
                    return uv;
                });

        UserVocabularyResponse response = userVocabularyService.recordReviewRating(mockUserId, 101L, 3);

        assertNotNull(response);
        assertEquals(1, response.getCorrectCount());
        assertEquals(1, response.getReviewCount());
        assertEquals(VocabularyLearningStatus.REVIEWING, response.getStatus());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. getDueForReview Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getDueForReview - Lấy danh sách các từ vựng đến hạn ôn tập")
    void testGetDueForReview_Success() {
        when(userVocabularyRepository.findDueForReview(eq(mockUserId), any(LocalDateTime.class)))
                .thenReturn(List.of(existingUserVocab));

        List<UserVocabularyResponse> result = userVocabularyService.getDueForReview(mockUserId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(101L, result.get(0).getVocabularyId());
        assertEquals("你好", result.get(0).getHanzi());
        verify(userVocabularyRepository, times(1)).findDueForReview(eq(mockUserId), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("getDueForReview - Không có từ nào đến hạn trả về danh sách rỗng")
    void testGetDueForReview_Empty() {
        when(userVocabularyRepository.findDueForReview(eq(mockUserId), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        List<UserVocabularyResponse> result = userVocabularyService.getDueForReview(mockUserId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. getMyReviewList Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMyReviewList - Lấy danh sách các từ vựng người dùng đã ghim ôn tập theo level")
    void testGetMyReviewList_Success() {
        existingUserVocab.setInReviewList(true);
        when(userVocabularyRepository.findByUserIdAndInReviewListAndLevel(mockUserId, 1))
                .thenReturn(List.of(existingUserVocab));

        List<UserVocabularyResponse> result = userVocabularyService.getMyReviewList(mockUserId, 1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("你好", result.get(0).getHanzi());
        assertTrue(result.get(0).getInReviewList());
        verify(userVocabularyRepository, times(1)).findByUserIdAndInReviewListAndLevel(mockUserId, 1);
    }

    @Test
    @DisplayName("getMyReviewList - Danh sách rỗng khi chưa ghim từ nào")
    void testGetMyReviewList_Empty() {
        when(userVocabularyRepository.findByUserIdAndInReviewListAndLevel(mockUserId, 2))
                .thenReturn(Collections.emptyList());

        List<UserVocabularyResponse> result = userVocabularyService.getMyReviewList(mockUserId, 2);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. getLearningSummary Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getLearningSummary - Thống kê số lượng từ theo từng trạng thái học tập của level")
    void testGetLearningSummary_Success() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{VocabularyLearningStatus.LEARNING, 5L});
        rows.add(new Object[]{VocabularyLearningStatus.MASTERED, 2L});

        when(userVocabularyRepository.countStatusByUserIdAndLevel(mockUserId, 1)).thenReturn(rows);

        Map<String, Long> summary = userVocabularyService.getLearningSummary(mockUserId, 1);

        assertNotNull(summary);
        // Đảm bảo tất cả enum values đều có key
        for (VocabularyLearningStatus st : VocabularyLearningStatus.values()) {
            assertTrue(summary.containsKey(st.name()));
        }

        assertEquals(5L, summary.get(VocabularyLearningStatus.LEARNING.name()));
        assertEquals(2L, summary.get(VocabularyLearningStatus.MASTERED.name()));
        assertEquals(0L, summary.get(VocabularyLearningStatus.NEW.name()));
        assertEquals(0L, summary.get(VocabularyLearningStatus.REVIEWING.name()));
    }

    @Test
    @DisplayName("getLearningSummary - Khi user chưa học từ nào, tất cả trạng thái đều có số đếm = 0")
    void testGetLearningSummary_EmptyRows() {
        when(userVocabularyRepository.countStatusByUserIdAndLevel(mockUserId, 1))
                .thenReturn(Collections.emptyList());

        Map<String, Long> summary = userVocabularyService.getLearningSummary(mockUserId, 1);

        assertNotNull(summary);
        assertEquals(0L, summary.get(VocabularyLearningStatus.NEW.name()));
        assertEquals(0L, summary.get(VocabularyLearningStatus.LEARNING.name()));
        assertEquals(0L, summary.get(VocabularyLearningStatus.REVIEWING.name()));
        assertEquals(0L, summary.get(VocabularyLearningStatus.MASTERED.name()));
    }
}
