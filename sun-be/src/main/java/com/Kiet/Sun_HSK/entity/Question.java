package com.Kiet.Sun_HSK.entity;

import com.Kiet.Sun_HSK.enums.QuestionType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "questions")
@SQLDelete(sql = "UPDATE questions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    ExamSection section;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    QuestionType questionType;

    /** Nội dung câu hỏi / đoạn đọc / transcript */
    @Column(columnDefinition = "TEXT")
    String content;

    /** URL file audio (dành cho Listening) */
    @Column(name = "audio_url", columnDefinition = "TEXT")
    String audioUrl;

    /** URL ảnh (dành cho Picture Selection) */
    @Column(name = "image_url", columnDefinition = "TEXT")
    String imageUrl;

    @Builder.Default
    @Column(nullable = false)
    int points = 1;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    int sortOrder = 0;

    /** Giải thích đáp án đúng (hiển thị sau khi nộp bài) */
    @Column(columnDefinition = "TEXT")
    String explanation;

    /**
     * Đáp án đúng dạng text — dùng cho Fill-in-blank.
     * Không dùng cho Multiple Choice (dùng QuestionOption.isCorrect).
     */
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    String correctAnswer;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}
