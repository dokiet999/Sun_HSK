package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "attempt_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "question_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    Question question;

    /** ID option đã chọn — dùng cho MC, T/F, Picture, Dialogue */
    @Column(name = "selected_option_id")
    UUID selectedOptionId;

    /** Câu trả lời dạng text — dùng cho Fill-in-blank, Writing */
    @Column(name = "text_answer", columnDefinition = "TEXT")
    String textAnswer;

    /**
     * JSON string cho dạng Matching.
     * Format: {"optionId1":"matchKey1","optionId2":"matchKey2"}
     */
    @Column(name = "match_pairs", columnDefinition = "TEXT")
    String matchPairs;

    /**
     * JSON string cho dạng Sentence Ordering.
     * Format: ["uuid1","uuid2","uuid3"]
     */
    @Column(name = "order_answer", columnDefinition = "TEXT")
    String orderAnswer;

    /** null = chưa chấm (Writing), true/false = đã chấm */
    @Column(name = "is_correct")
    Boolean isCorrect;

    @Builder.Default
    @Column(name = "points_earned")
    int pointsEarned = 0;

    @Builder.Default
    @Column(name = "answered_at")
    LocalDateTime answeredAt = LocalDateTime.now();
}
