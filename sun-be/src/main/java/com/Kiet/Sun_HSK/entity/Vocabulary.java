package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vocabularies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Vocabulary {

    /**
     * Giữ nguyên id từ JSON dataset làm PK (không dùng auto-increment),
     * đồng bộ trực tiếp với file audio words/{id}.mp3
     */
    @Id
    Long id;

    @Column(name = "hsk_level", nullable = false)
    int hskLevel;

    @Column(name = "lesson_number")
    Integer lessonNumber;

    @Column(name = "position")
    Integer position;

    @Column(nullable = false, length = 100)
    String hanzi;

    @Column(nullable = false, length = 200)
    String pinyin;

    @Column(name = "han_viet", length = 200)
    String hanViet;

    /** Từ loại rút gọn: Động, Danh, Tính, Phó, Lượng... */
    @Column(length = 50)
    String pos;

    @Column(name = "meaning_vi", nullable = false, columnDefinition = "TEXT")
    String meaningVi;

    @Column(name = "meaning_en", columnDefinition = "TEXT")
    String meaningEn;

    /** Đường dẫn âm thanh: words/{id}.mp3 */
    @Column(name = "audio_path", columnDefinition = "TEXT")
    String audioPath;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    int sortOrder = 0;

    /** Trạng thái ghim review mặc định từ dataset */
    @Builder.Default
    @Column(name = "default_in_review_list", nullable = false)
    Boolean defaultInReviewList = false;

    /** Giá trị xáo trộn thứ tự học flashcard */
    @Builder.Default
    @Column(name = "shuffle_rank")
    Double shuffleRank = 0.0;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @OneToMany(mappedBy = "vocabulary", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    java.util.Set<VocabularyCollocation> collocations = new java.util.LinkedHashSet<>();

    @OneToMany(mappedBy = "vocabulary", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    java.util.Set<VocabularyExample> examples = new java.util.LinkedHashSet<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
