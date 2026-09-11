package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.request.UpdateReviewListRequest;
import com.Kiet.Sun_HSK.dto.response.UserVocabularyResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.service.UserService;
import com.Kiet.Sun_HSK.service.UserVocabularyService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me/vocabulary")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserVocabularyController {

    UserVocabularyService userVocabularyService;
    UserService userService;

    /**
     * POST /api/v1/me/vocabulary/{vocabId}/learn
     * Bắt đầu học từ vựng (seed in_review_list từ default_in_review_list).
     */
    @PostMapping("/{vocabId}/learn")
    public ResponseEntity<ApiResponse<UserVocabularyResponse>> startLearning(
            @PathVariable Long vocabId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        UserVocabularyResponse response = userVocabularyService.startLearning(user.getId(), vocabId);
        return ResponseEntity.ok(ApiResponse.success("Bắt đầu học từ vựng thành công", response));
    }

    /**
     * PATCH /api/v1/me/vocabulary/{vocabId}/review-list
     * User tự do bật/tắt ghim ôn tập cho từ vựng này.
     */
    @PatchMapping("/{vocabId}/review-list")
    public ResponseEntity<ApiResponse<UserVocabularyResponse>> toggleReviewList(
            @PathVariable Long vocabId,
            @RequestBody UpdateReviewListRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        boolean inReview = Boolean.TRUE.equals(request.getInReviewList());
        UserVocabularyResponse response = userVocabularyService.toggleReviewList(user.getId(), vocabId, inReview);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách ôn tập thành công", response));
    }

    /**
     * POST /api/v1/me/vocabulary/{vocabId}/review?rating=3
     * Đánh giá độ nhớ thẻ flashcard theo Spaced Repetition (1: Quên, 2: Khó, 3: Tốt, 4: Dễ).
     */
    @PostMapping("/{vocabId}/review")
    public ResponseEntity<ApiResponse<UserVocabularyResponse>> recordReview(
            @PathVariable Long vocabId,
            @RequestParam(defaultValue = "3") int rating,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        UserVocabularyResponse response = userVocabularyService.recordReviewRating(user.getId(), vocabId, rating);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận ôn tập", response));
    }

    /**
     * GET /api/v1/me/vocabulary/review
     * Lấy danh sách các từ vựng đến hạn cần ôn tập hôm nay (theo thuật toán SRS).
     */
    @GetMapping("/review")
    public ResponseEntity<ApiResponse<List<UserVocabularyResponse>>> getDueForReview(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        List<UserVocabularyResponse> list = userVocabularyService.getDueForReview(user.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * GET /api/v1/me/vocabulary/my-review-list?level=1
     * Lấy danh sách từ vựng mà user đã ghim vào danh sách ôn tập riêng.
     */
    @GetMapping("/my-review-list")
    public ResponseEntity<ApiResponse<List<UserVocabularyResponse>>> getMyReviewList(
            @RequestParam(defaultValue = "1") int level,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        List<UserVocabularyResponse> list = userVocabularyService.getMyReviewList(user.getId(), level);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * GET /api/v1/me/vocabulary/summary?level=1
     * Thống kê số lượng từ theo trạng thái (NEW, LEARNING, REVIEWING, MASTERED).
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getSummary(
            @RequestParam(defaultValue = "1") int level,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        Map<String, Long> summary = userVocabularyService.getLearningSummary(user.getId(), level);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
