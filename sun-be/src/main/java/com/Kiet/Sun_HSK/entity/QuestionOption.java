package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.SQLDelete;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "question_options")
@SQLDelete(sql = "UPDATE question_options SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    Question question;

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    /** URL ảnh — dùng cho dạng chọn tranh */
    @Column(name = "image_url", columnDefinition = "TEXT")
    String imageUrl;

    @Builder.Default
    @Column(name = "is_correct", nullable = false)
    boolean isCorrect = false;

    /**
     * Key dùng cho dạng Matching — ví dụ: "A", "B", "C".
     * User nối option này với option có match_key tương ứng ở cột kia.
     */
    @Column(name = "match_key", length = 50)
    String matchKey;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    int sortOrder = 0;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}
