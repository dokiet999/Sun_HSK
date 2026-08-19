package com.Kiet.Sun_HSK.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

/** Trả về sau khi user bắt đầu làm bài */
@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttemptStartResponse {

    UUID attemptId;
    UUID examId;
    String examTitle;
    int timeLimitMinutes;
    LocalDateTime startedAt;
    LocalDateTime expiresAt;
}
