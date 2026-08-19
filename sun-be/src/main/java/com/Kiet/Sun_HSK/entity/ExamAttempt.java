package com.Kiet.Sun_HSK.entity;

import com.Kiet.Sun_HSK.enums.AttemptStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    Exam exam;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    AttemptStatus status = AttemptStatus.IN_PROGRESS;

    @Builder.Default
    @Column(name = "started_at")
    LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "submitted_at")
    LocalDateTime submittedAt;

    /** Thời điểm hết hạn làm bài = startedAt + timeLimit */
    @Column(name = "expires_at")
    LocalDateTime expiresAt;

    /** Số giây đã làm */
    @Column(name = "time_spent_secs")
    Integer timeSpentSecs;

    @Builder.Default
    @Column(name = "total_score")
    int totalScore = 0;

    @Builder.Default
    @Column(name = "total_points")
    int totalPoints = 0;

    @Builder.Default
    @Column(name = "score_percent", precision = 5, scale = 2)
    BigDecimal scorePercent = BigDecimal.ZERO;

    @Builder.Default
    Boolean passed = false;

    @Builder.Default
    @Column(name = "listening_score")
    int listeningScore = 0;

    @Builder.Default
    @Column(name = "reading_score")
    int readingScore = 0;

    @Builder.Default
    @Column(name = "writing_score")
    int writingScore = 0;
}
