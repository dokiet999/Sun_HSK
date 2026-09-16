package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest;
import com.Kiet.Sun_HSK.dto.response.VocabularyResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyStatsResponse;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import com.Kiet.Sun_HSK.service.importer.VocabularyImportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminVocabularyServiceTest {

    @Mock
    private VocabularyRepository vocabularyRepository;

    @Mock
    private VocabularyImportService vocabularyImportService;

    @Mock
    private VocabularyService vocabularyService;

    @InjectMocks
    private AdminVocabularyService adminVocabularyService;

    private Vocabulary mockVocab;
    private VocabularyResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockVocab = Vocabulary.builder()
                .id(101L)
                .hskLevel(1)
                .lessonNumber(1)
                .position(0)
                .hanzi("你好")
                .pinyin("nǐ hǎo")
                .hanViet("nhĩ hảo")
                .pos("Thán từ")
                .meaningVi("xin chào")
                .sortOrder(0)
                .build();

        mockResponse = VocabularyResponse.builder()
                .id(101L)
                .hskLevel(1)
                .lessonNumber(1)
                .hanzi("你好")
                .pinyin("nǐ hǎo")
                .meaningVi("xin chào")
                .build();
    }

    @Test
    @DisplayName("searchVocabulary - Trả về phân trang từ vựng theo điều kiện lọc")
    void testSearchVocabulary() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Vocabulary> list = List.of(mockVocab);
        Page<Vocabulary> page = new PageImpl<>(list, pageable, 1);

        when(vocabularyRepository.searchAdmin(1, 1, "你好", pageable)).thenReturn(page);
        when(vocabularyService.mapToResponse(mockVocab, null)).thenReturn(mockResponse);

        Page<VocabularyResponse> result = adminVocabularyService.searchVocabulary(1, 1, "你好", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("你好", result.getContent().get(0).getHanzi());
        verify(vocabularyRepository, times(1)).searchAdmin(1, 1, "你好", pageable);
    }

    @Test
    @DisplayName("getVocabularyById - Tìm thấy từ vựng hợp lệ")
    void testGetVocabularyById_Success() {
        when(vocabularyRepository.findByIdWithDetails(101L)).thenReturn(Optional.of(mockVocab));
        when(vocabularyService.mapToResponse(mockVocab, null)).thenReturn(mockResponse);

        VocabularyResponse response = adminVocabularyService.getVocabularyById(101L);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("你好", response.getHanzi());
    }

    @Test
    @DisplayName("getVocabularyById - Ném AppException VOCABULARY_NOT_FOUND khi không tìm thấy")
    void testGetVocabularyById_NotFound() {
        when(vocabularyRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () ->
                adminVocabularyService.getVocabularyById(999L));

        assertEquals(ErrorCode.VOCABULARY_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("createVocabulary - Tự động cấp ID mới nếu id null")
    void testCreateVocabulary_AutoId() {
        VocabularyImportRequest request = new VocabularyImportRequest();
        request.setHanzi("谢谢");
        request.setPinyin("xièxie");
        request.setLevel(1);
        request.setMeaningVi("cảm ơn");

        when(vocabularyRepository.findMaxId()).thenReturn(200L);
        when(vocabularyImportService.saveSingle(any())).thenReturn(mockVocab);
        when(vocabularyRepository.findByIdWithDetails(mockVocab.getId())).thenReturn(Optional.of(mockVocab));
        when(vocabularyService.mapToResponse(mockVocab, null)).thenReturn(mockResponse);

        VocabularyResponse response = adminVocabularyService.createVocabulary(request);

        assertNotNull(response);
        assertEquals(201L, request.getId());
        verify(vocabularyImportService, times(1)).saveSingle(request);
    }

    @Test
    @DisplayName("updateVocabulary - Cập nhật thành công từ vựng đã tồn tại")
    void testUpdateVocabulary_Success() {
        VocabularyImportRequest request = new VocabularyImportRequest();
        request.setHanzi("你好");
        request.setMeaningVi("xin chào bạn");

        when(vocabularyRepository.existsById(101L)).thenReturn(true);
        when(vocabularyImportService.saveSingle(request)).thenReturn(mockVocab);
        when(vocabularyRepository.findByIdWithDetails(mockVocab.getId())).thenReturn(Optional.of(mockVocab));
        when(vocabularyService.mapToResponse(mockVocab, null)).thenReturn(mockResponse);

        VocabularyResponse response = adminVocabularyService.updateVocabulary(101L, request);

        assertNotNull(response);
        assertEquals(101L, request.getId());
        verify(vocabularyImportService, times(1)).saveSingle(request);
    }

    @Test
    @DisplayName("updateVocabulary - Ném VOCABULARY_NOT_FOUND nếu id không tồn tại")
    void testUpdateVocabulary_NotFound() {
        VocabularyImportRequest request = new VocabularyImportRequest();
        when(vocabularyRepository.existsById(999L)).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () ->
                adminVocabularyService.updateVocabulary(999L, request));

        assertEquals(ErrorCode.VOCABULARY_NOT_FOUND, exception.getErrorCode());
        verify(vocabularyImportService, never()).saveSingle(any());
    }

    @Test
    @DisplayName("deleteVocabulary - Xóa thành công khi tồn tại")
    void testDeleteVocabulary_Success() {
        when(vocabularyRepository.existsById(101L)).thenReturn(true);

        adminVocabularyService.deleteVocabulary(101L);

        verify(vocabularyRepository, times(1)).deleteById(101L);
    }

    @Test
    @DisplayName("deleteVocabulary - Ném VOCABULARY_NOT_FOUND khi id không tồn tại")
    void testDeleteVocabulary_NotFound() {
        when(vocabularyRepository.existsById(999L)).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () ->
                adminVocabularyService.deleteVocabulary(999L));

        assertEquals(ErrorCode.VOCABULARY_NOT_FOUND, exception.getErrorCode());
        verify(vocabularyRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("getVocabularyStats - Tổng hợp đúng số từ và phân loại level")
    void testGetVocabularyStats() {
        when(vocabularyRepository.count()).thenReturn(150L);
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{1, 100L});
        rows.add(new Object[]{2, 50L});
        when(vocabularyRepository.countGroupByHskLevel()).thenReturn(rows);

        VocabularyStatsResponse stats = adminVocabularyService.getVocabularyStats();

        assertNotNull(stats);
        assertEquals(150L, stats.getTotalWords());
        assertEquals(100L, stats.getCountsByLevel().get(1));
        assertEquals(50L, stats.getCountsByLevel().get(2));
        assertEquals(0L, stats.getCountsByLevel().get(3));
    }

    @Test
    @DisplayName("importBatch - Gọi VocabularyImportService với defaultLesson")
    void testImportBatch() {
        List<VocabularyImportRequest> list = List.of(new VocabularyImportRequest());
        when(vocabularyImportService.importBatch(list, 2)).thenReturn(1);

        int count = adminVocabularyService.importBatch(list, 2);

        assertEquals(1, count);
        verify(vocabularyImportService, times(1)).importBatch(list, 2);
    }
}
