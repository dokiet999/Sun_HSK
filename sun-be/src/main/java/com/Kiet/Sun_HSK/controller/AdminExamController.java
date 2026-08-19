package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.request.*;
import com.Kiet.Sun_HSK.dto.response.*;
import com.Kiet.Sun_HSK.service.ExamService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/exams")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminExamController {

    ExamService examService;

    // ── Quản lý đề thi ───────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/exams
     * Liệt kê tất cả đề (bao gồm DRAFT, ARCHIVED).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExamSummaryResponse>>> listAll(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(examService.listAll(pageable)));
    }

    /**
     * GET /api/v1/admin/exams/{id}
     * Xem chi tiết đề (kể cả DRAFT) — có câu hỏi + đáp án.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamDetailResponse>> getDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(examService.getDetailAdmin(id)));
    }

    /**
     * POST /api/v1/admin/exams
     * Tạo đề thi mới (status = DRAFT).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ExamSummaryResponse>> createExam(
            @Valid @RequestBody CreateExamRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đề thi thành công", examService.createExam(request)));
    }

    /**
     * PUT /api/v1/admin/exams/{id}/publish
     * Công bố đề thi (DRAFT → PUBLISHED).
     */
    @PutMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<ExamSummaryResponse>> publishExam(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.success("Đề thi đã được công bố", examService.publishExam(id)));
    }

    /**
     * DELETE /api/v1/admin/exams/{id}
     * Xóa đề thi.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable UUID id) {
        examService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa đề thi"));
    }

    // ── Quản lý phần thi (Section) ────────────────────────────────────────────

    /**
     * POST /api/v1/admin/exams/{id}/sections
     * Thêm phần thi vào đề.
     */
    @PostMapping("/{id}/sections")
    public ResponseEntity<ApiResponse<SectionResponse>> addSection(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSectionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm phần thi thành công",
                        examService.addSection(id, request)));
    }

    // ── Quản lý câu hỏi ──────────────────────────────────────────────────────

    /**
     * POST /api/v1/admin/exams/sections/{sectionId}/questions
     * Thêm câu hỏi vào phần thi.
     */
    @PostMapping("/sections/{sectionId}/questions")
    public ResponseEntity<ApiResponse<QuestionResponse>> addQuestion(
            @PathVariable UUID sectionId,
            @Valid @RequestBody CreateQuestionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm câu hỏi thành công",
                        examService.addQuestion(sectionId, request)));
    }

    /**
     * POST /api/v1/admin/exams/questions/{questionId}/options
     * Thêm lựa chọn đáp án cho câu hỏi.
     */
    @PostMapping("/questions/{questionId}/options")
    public ResponseEntity<ApiResponse<QuestionOptionResponse>> addOption(
            @PathVariable UUID questionId,
            @Valid @RequestBody CreateQuestionOptionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm lựa chọn thành công",
                        examService.addOption(questionId, request)));
    }
}
