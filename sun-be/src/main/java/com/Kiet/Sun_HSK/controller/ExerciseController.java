package com.Kiet.Sun_HSK.controller;

import com.Kiet.Sun_HSK.common.ApiResponse;
import com.Kiet.Sun_HSK.dto.request.ExerciseAttemptRequest;
import com.Kiet.Sun_HSK.dto.response.ExerciseAttemptResponse;
import com.Kiet.Sun_HSK.dto.response.ExerciseResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.enums.ExerciseType;
import com.Kiet.Sun_HSK.service.ExerciseService;
import com.Kiet.Sun_HSK.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/exercises")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseController {

    ExerciseService exerciseService;
    UserService userService;

    /**
     * GET /api/v1/exercises?level=1&type=FILL_BLANK&lesson=1&pageSize=10
     * Lấy danh sách bài tập theo level và dạng bài tập.
     * Hỗ trợ lọc bài tập theo bài học cụ thể (lesson).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ExerciseResponse>>> getExercises(
            @RequestParam(defaultValue = "1") int level,
            @RequestParam(required = false) ExerciseType type,
            @RequestParam(required = false) Integer lesson,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        List<ExerciseResponse> exercises = exerciseService.getByLevelAndType(level, type, lesson, pageSize);
        return ResponseEntity.ok(ApiResponse.success(exercises));
    }

    /**
     * POST /api/v1/exercises/{id}/attempt
     * Nộp câu trả lời cho một bài tập → chấm điểm tức thì và lưu lịch sử.
     */
    @PostMapping("/{id}/attempt")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ExerciseAttemptResponse>> submitAttempt(
            @PathVariable Long id,
            @RequestBody ExerciseAttemptRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        ExerciseAttemptResponse response = exerciseService.attemptExercise(user.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận kết quả", response));
    }
}
