package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.request.AnswerItemRequest;
import com.Kiet.Sun_HSK.dto.request.SubmitAttemptRequest;
import com.Kiet.Sun_HSK.dto.response.*;
import com.Kiet.Sun_HSK.service.ExamAttemptService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExamController {

    ExamService examService;
    ExamAttemptService attemptService;

    // ── Danh sách đề thi (đã published) ──────────────────────────────────────

    /**
     * GET /api/v1/exams
     * Lấy danh sách đề thi đã công bố.
     * User chưa đăng nhập vẫn xem được, nhưng nếu đăng nhập sẽ thấy điểm cao nhất.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExamSummaryResponse>>> listExams(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = (userDetails != null) ? userDetails.getUsername() : null;
        Page<ExamSummaryResponse> exams = examService.listPublished(pageable, email);
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    /**
     * GET /api/v1/exams/{id}
     * Xem chi tiết đề thi (có câu hỏi, KHÔNG có đáp án).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamDetailResponse>> getExam(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(examService.getDetail(id)));
    }

    // ── Làm bài ───────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/exams/{id}/attempts
     * Bắt đầu làm một đề thi → trả về attemptId + expiresAt.
     */
    @PostMapping("/{id}/attempts")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttemptStartResponse>> startAttempt(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AttemptStartResponse response = attemptService.startAttempt(id, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bắt đầu làm bài thành công", response));
    }

    /**
     * POST /api/v1/exams/attempts/{attemptId}/answers
     * Lưu câu trả lời realtime (từng câu một khi user trả lời).
     */
    @PostMapping("/attempts/{attemptId}/answers")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> saveAnswer(
            @PathVariable UUID attemptId,
            @RequestBody AnswerItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        attemptService.saveAnswer(attemptId, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu câu trả lời"));
    }

    /**
     * POST /api/v1/exams/attempts/{attemptId}/submit
     * Nộp bài → chấm điểm tự động → trả về kết quả đầy đủ.
     */
    @PostMapping("/attempts/{attemptId}/submit")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttemptResultResponse>> submitAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody SubmitAttemptRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AttemptResultResponse result = attemptService.submitAttempt(
                attemptId, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Nộp bài thành công", result));
    }

    /**
     * GET /api/v1/exams/attempts/{attemptId}/result
     * Xem kết quả sau khi đã nộp bài.
     */
    @GetMapping("/attempts/{attemptId}/result")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttemptResultResponse>> getResult(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AttemptResultResponse result = attemptService.getResult(
                attemptId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/v1/exams/attempts/history
     * Xem lịch sử các lần làm bài của user hiện tại.
     */
    @GetMapping("/attempts/history")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<AttemptHistoryResponse>>> getHistory(
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Page<AttemptHistoryResponse> history = attemptService.getHistory(
                userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
