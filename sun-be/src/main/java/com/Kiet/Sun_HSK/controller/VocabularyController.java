package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.service.UserService;
import com.Kiet.Sun_HSK.service.VocabularyService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vocabulary")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabularyController {

    VocabularyService vocabularyService;
    UserService userService;

    /**
     * GET /api/v1/vocabulary?level=1&lesson=1&pageSize=10
     * Lấy danh sách từ vựng theo HSK level.
     * Nếu có tham số 'lesson', tự động phân trang theo bài học (ví dụ 10 từ/bài).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabularyResponse>>> listByLevel(
            @RequestParam(defaultValue = "1") int level,
            @RequestParam(required = false) Integer lesson,
            @RequestParam(defaultValue = "10") int pageSize,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserIdOrNull(userDetails);
        List<VocabularyResponse> list;
        if (lesson != null && lesson > 0) {
            list = vocabularyService.getWordsByLesson(level, lesson, pageSize, userId).getWords();
        } else {
            list = vocabularyService.getByLevel(level, userId);
        }
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * GET /api/v1/vocabulary/lessons?level=1&pageSize=10
     * GET /api/v1/vocabulary/lessons/overview?level=1&pageSize=10
     * Lấy danh sách tổng quan các bài học của 1 level, hiển thị tiến độ học tập.
     */
    @GetMapping({"/lessons", "/lessons/overview"})
    public ResponseEntity<ApiResponse<com.Kiet.Sun_HSK.dto.response.LessonOverviewResponse>> getLessonOverview(
            @RequestParam(defaultValue = "1") int level,
            @RequestParam(defaultValue = "10") int pageSize,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserIdOrNull(userDetails);
        com.Kiet.Sun_HSK.dto.response.LessonOverviewResponse response = vocabularyService.getLessonOverview(level, pageSize, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/vocabulary/lessons/{lessonNumber}?level=1&pageSize=10
     * Lấy chi tiết các từ vựng của một bài học cụ thể (kèm collocation, ví dụ, trạng thái học của user).
     */
    @GetMapping("/lessons/{lessonNumber}")
    public ResponseEntity<ApiResponse<com.Kiet.Sun_HSK.dto.response.LessonVocabularyResponse>> getWordsByLesson(
            @PathVariable int lessonNumber,
            @RequestParam(defaultValue = "1") int level,
            @RequestParam(defaultValue = "10") int pageSize,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserIdOrNull(userDetails);
        com.Kiet.Sun_HSK.dto.response.LessonVocabularyResponse response =
                vocabularyService.getWordsByLesson(level, lessonNumber, pageSize, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/vocabulary/{id}
     * Xem chi tiết 1 từ vựng (kèm collocations và câu ví dụ).
     */
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<VocabularyResponse>> getDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserIdOrNull(userDetails);
        VocabularyResponse response = vocabularyService.getById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private UUID getUserIdOrNull(UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
        try {
            User user = userService.findByEmailOrThrow(userDetails.getUsername());
            return user.getId();
        } catch (Exception e) {
            return null;
        }
    }
}
