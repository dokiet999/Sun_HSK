package com.Kiet.Sun_HSK.entity;

import com.Kiet.Sun_HSK.enums.ExamStatus;
import com.Kiet.Sun_HSK.enums.ExamType;
import com.Kiet.Sun_HSK.enums.HskVersion;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exams")
@SQLDelete(sql = "UPDATE exams SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "hsk_version", nullable = false, length = 10)
    HskVersion hskVersion;

    @Column(name = "hsk_level", nullable = false)
    int hskLevel;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "exam_type", nullable = false, length = 30)
    ExamType examType = ExamType.PRACTICE;

    /** Tổng thời gian làm bài (phút) */
    @Column(name = "time_limit", nullable = false)
    int timeLimit;

    @Builder.Default
    @Column(name = "total_questions")
    int totalQuestions = 0;

    @Builder.Default
    @Column(name = "total_points")
    int totalPoints = 0;

    /** Điểm % cần đạt để qua */
    @Builder.Default
    @Column(name = "passing_score")
    int passingScore = 60;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    ExamStatus status = ExamStatus.DRAFT;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
