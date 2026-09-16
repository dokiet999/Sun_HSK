package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest;
import com.Kiet.Sun_HSK.dto.response.VocabularyResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyStatsResponse;
import com.Kiet.Sun_HSK.service.AdminVocabularyService;
import com.Kiet.Sun_HSK.service.generator.ExerciseGenerationService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminVocabularyControllerTest {

    @Mock
    private AdminVocabularyService adminVocabularyService;

    @Mock
    private ExerciseGenerationService exerciseGenerationService;

    @InjectMocks
    private AdminVocabularyController adminVocabularyController;

    private VocabularyResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = VocabularyResponse.builder()
                .id(1L)
                .hskLevel(1)
                .lessonNumber(1)
                .hanzi("你好")
                .pinyin("nǐ hǎo")
                .meaningVi("xin chào")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/vocabulary - Tìm kiếm phân trang")
    void testSearchVocabulary() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<VocabularyResponse> page = new PageImpl<>(List.of(sampleResponse), pageable, 1);

        when(adminVocabularyService.searchVocabulary(1, 1, "你好", pageable)).thenReturn(page);

        ResponseEntity<ApiResponse<Page<VocabularyResponse>>> response =
                adminVocabularyController.searchVocabulary(1, 1, "你好", pageable);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getResult().getTotalElements());
    }

    @Test
    @DisplayName("GET /api/v1/admin/vocabulary/stats - Lấy thống kê số lượng")
    void testGetVocabularyStats() {
        VocabularyStatsResponse stats = VocabularyStatsResponse.builder()
                .totalWords(100)
                .countsByLevel(Map.of(1, 50L, 2, 50L))
                .build();

        when(adminVocabularyService.getVocabularyStats()).thenReturn(stats);

        ResponseEntity<ApiResponse<VocabularyStatsResponse>> response =
                adminVocabularyController.getVocabularyStats();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(100, response.getBody().getResult().getTotalWords());
    }

    @Test
    @DisplayName("GET /api/v1/admin/vocabulary/{id} - Lấy chi tiết từ vựng")
    void testGetVocabularyDetail() {
        when(adminVocabularyService.getVocabularyById(1L)).thenReturn(sampleResponse);

        ResponseEntity<ApiResponse<VocabularyResponse>> response =
                adminVocabularyController.getVocabularyDetail(1L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("你好", response.getBody().getResult().getHanzi());
    }

    @Test
    @DisplayName("POST /api/v1/admin/vocabulary - Thêm mới từ vựng")
    void testCreateVocabulary() {
        VocabularyImportRequest request = new VocabularyImportRequest();
        request.setHanzi("你好");

        when(adminVocabularyService.createVocabulary(request)).thenReturn(sampleResponse);

        ResponseEntity<ApiResponse<VocabularyResponse>> response =
                adminVocabularyController.createVocabulary(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Thêm từ vựng thành công", response.getBody().getMessage());
    }

    @Test
    @DisplayName("PUT /api/v1/admin/vocabulary/{id} - Cập nhật từ vựng")
    void testUpdateVocabulary() {
        VocabularyImportRequest request = new VocabularyImportRequest();
        request.setHanzi("你好");

        when(adminVocabularyService.updateVocabulary(1L, request)).thenReturn(sampleResponse);

        ResponseEntity<ApiResponse<VocabularyResponse>> response =
                adminVocabularyController.updateVocabulary(1L, request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Cập nhật từ vựng thành công", response.getBody().getMessage());
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/vocabulary/{id} - Xóa từ vựng")
    void testDeleteVocabulary() {
        doNothing().when(adminVocabularyService).deleteVocabulary(1L);

        ResponseEntity<ApiResponse<Void>> response =
                adminVocabularyController.deleteVocabulary(1L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Đã xóa từ vựng", response.getBody().getMessage());
        verify(adminVocabularyService, times(1)).deleteVocabulary(1L);
    }

    @Test
    @DisplayName("POST /api/v1/admin/vocabulary/import - Import từ vựng kèm defaultLesson")
    void testImportVocabulary() {
        List<VocabularyImportRequest> list = List.of(new VocabularyImportRequest());
        when(adminVocabularyService.importBatch(list, 1)).thenReturn(1);

        ResponseEntity<ApiResponse<Integer>> response =
                adminVocabularyController.importVocabulary(list, 1);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getResult());
    }

    @Test
    @DisplayName("POST /api/v1/admin/exercises/generate - Sinh bài tập tự động")
    void testGenerateExercises() {
        when(exerciseGenerationService.generateForLevel(1)).thenReturn(10);

        ResponseEntity<ApiResponse<Integer>> response =
                adminVocabularyController.generateExercises(1);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(10, response.getBody().getResult());
    }
}
