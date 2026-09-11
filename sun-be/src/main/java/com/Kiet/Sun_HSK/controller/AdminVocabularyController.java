package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest;
import com.Kiet.Sun_HSK.dto.response.VocabularyResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyStatsResponse;
import com.Kiet.Sun_HSK.service.AdminVocabularyService;
import com.Kiet.Sun_HSK.service.generator.ExerciseGenerationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminVocabularyController {

    AdminVocabularyService adminVocabularyService;
    ExerciseGenerationService exerciseGenerationService;

    /**
     * GET /api/v1/admin/vocabulary
     * Tìm kiếm và phân trang từ vựng cho admin
     */
    @GetMapping("/vocabulary")
    public ResponseEntity<ApiResponse<Page<VocabularyResponse>>> searchVocabulary(
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) Integer lesson,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminVocabularyService.searchVocabulary(level, lesson, keyword, pageable)
        ));
    }

    /**
     * GET /api/v1/admin/vocabulary/stats
     * Lấy thống kê tổng số từ và số từ theo từng cấp độ HSK
     */
    @GetMapping("/vocabulary/stats")
    public ResponseEntity<ApiResponse<VocabularyStatsResponse>> getVocabularyStats() {
        return ResponseEntity.ok(ApiResponse.success(adminVocabularyService.getVocabularyStats()));
    }

    /**
     * GET /api/v1/admin/vocabulary/{id}
     * Lấy chi tiết từ vựng kèm câu ví dụ và cụm từ
     */
    @GetMapping("/vocabulary/{id}")
    public ResponseEntity<ApiResponse<VocabularyResponse>> getVocabularyDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminVocabularyService.getVocabularyById(id)));
    }

    /**
     * POST /api/v1/admin/vocabulary
     * Thêm mới 1 từ vựng
     */
    @PostMapping("/vocabulary")
    public ResponseEntity<ApiResponse<VocabularyResponse>> createVocabulary(
            @RequestBody VocabularyImportRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Thêm từ vựng thành công",
                adminVocabularyService.createVocabulary(request)
        ));
    }

    /**
     * PUT /api/v1/admin/vocabulary/{id}
     * Cập nhật từ vựng
     */
    @PutMapping("/vocabulary/{id}")
    public ResponseEntity<ApiResponse<VocabularyResponse>> updateVocabulary(
            @PathVariable Long id,
            @RequestBody VocabularyImportRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật từ vựng thành công",
                adminVocabularyService.updateVocabulary(id, request)
        ));
    }

    /**
     * DELETE /api/v1/admin/vocabulary/{id}
     * Xóa một từ vựng và toàn bộ dữ liệu phụ thuộc.
     */
    @DeleteMapping("/vocabulary/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVocabulary(@PathVariable Long id) {
        adminVocabularyService.deleteVocabulary(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa từ vựng"));
    }

    /**
     * POST /api/v1/admin/vocabulary/import
     * Nhận batch danh sách từ vựng từ file JSON và import vào DB.
     */
    @PostMapping("/vocabulary/import")
    public ResponseEntity<ApiResponse<Integer>> importVocabulary(
            @RequestBody List<VocabularyImportRequest> requests,
            @RequestParam(required = false) Integer defaultLesson
    ) {
        int count = adminVocabularyService.importBatch(requests, defaultLesson);
        return ResponseEntity.ok(ApiResponse.success("Import thành công " + count + " từ vựng", count));
    }

    /**
     * POST /api/v1/admin/exercises/generate?level=1
     * Kích hoạt tự động sinh bài tập cho level chỉ định.
     */
    @PostMapping("/exercises/generate")
    public ResponseEntity<ApiResponse<Integer>> generateExercises(
            @RequestParam(defaultValue = "1") int level
    ) {
        int count = exerciseGenerationService.generateForLevel(level);
        return ResponseEntity.ok(ApiResponse.success("Sinh thành công " + count + " bài tập cho HSK " + level, count));
    }
}
