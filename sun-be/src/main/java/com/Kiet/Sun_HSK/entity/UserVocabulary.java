package com.Kiet.Sun_HSK.entity;

import com.Kiet.Sun_HSK.enums.VocabularyLearningStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_vocabularies", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_vocab", columnNames = {"user_id", "vocabulary_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_id", nullable = false)
    Vocabulary vocabulary;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    VocabularyLearningStatus status = VocabularyLearningStatus.NEW;

    /**
     * Trạng thái ghim ôn tập riêng của User.
     * Khi user bắt đầu học, giá trị này được khởi tạo = vocabulary.getDefaultInReviewList().
     * User có thể tự do bật/tắt review mà không làm thay đổi bảng Vocabulary gốc.
     */
    @Builder.Default
    @Column(name = "in_review_list", nullable = false)
    Boolean inReviewList = false;

    @Column(name = "last_reviewed_at")
    LocalDateTime lastReviewedAt;

    @Column(name = "next_review_at")
    LocalDateTime nextReviewAt;

    @Builder.Default
    @Column(name = "review_count", nullable = false)
    int reviewCount = 0;

    @Builder.Default
    @Column(name = "correct_count", nullable = false)
    int correctCount = 0;

    @Builder.Default
    @Column(name = "wrong_count", nullable = false)
    int wrongCount = 0;
}
