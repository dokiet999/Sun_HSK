package com.Kiet.Sun_HSK.exception;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Getter
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum ErrorCode {

    // ── Auth ─────────────────────────────────────────────────────────────────
    USER_EXISTED(400, "Email đã được sử dụng"),
    INVALID_CREDENTIALS(401, "Email hoặc mật khẩu không chính xác"),
    INVALID_TOKEN(401, "Token không hợp lệ hoặc đã hết hạn"),
    REFRESH_TOKEN_MISSING(400, "Refresh token không tồn tại"),
    ACCOUNT_DISABLED(403, "Tài khoản đã bị vô hiệu hóa"),

    // ── User ──────────────────────────────────────────────────────────────────
    USER_NOT_FOUND(404, "Không tìm thấy người dùng"),

    // ── Exam ──────────────────────────────────────────────────────────────────
    EXAM_NOT_FOUND(404, "Không tìm thấy đề thi"),
    EXAM_NOT_PUBLISHED(400, "Đề thi chưa được công bố"),
    SECTION_NOT_FOUND(404, "Không tìm thấy phần thi"),
    QUESTION_NOT_FOUND(404, "Không tìm thấy câu hỏi"),

    // ── Attempt ───────────────────────────────────────────────────────────────
    ATTEMPT_NOT_FOUND(404, "Không tìm thấy lần làm bài"),
    ATTEMPT_ALREADY_SUBMITTED(400, "Bài thi đã được nộp"),
    ATTEMPT_NOT_SUBMITTED(400, "Bài thi chưa được nộp"),
    ATTEMPT_EXPIRED(400, "Đã hết thời gian làm bài"),

    // ── Authorization ─────────────────────────────────────────────────────────
    UNAUTHORIZED(401, "Bạn cần đăng nhập để thực hiện thao tác này"),
    FORBIDDEN(403, "Bạn không có quyền thực hiện thao tác này"),

    // ── System ────────────────────────────────────────────────────────────────
    INTERNAL_ERROR(500, "Lỗi hệ thống, vui lòng thử lại sau"),
    VALIDATION_ERROR(400, "Dữ liệu không hợp lệ");

    int httpStatus;
    String message;
}
