package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "vocabulary_examples")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyExample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_id", nullable = false)
    Vocabulary vocabulary;

    /** Câu tiếng Trung (ví dụ: "请认真填写这张报名表。") */
    @Column(nullable = false, columnDefinition = "TEXT")
    String zh;

    /** Bản dịch tiếng Việt (ví dụ: "Hãy điền nghiêm túc vào phiếu đăng ký này.") */
    @Column(columnDefinition = "TEXT")
    String vi;

    /** File âm thanh: examples/{id}_{index}.mp3 */
    @Column(name = "audio_path", columnDefinition = "TEXT")
    String audioPath;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    int sortOrder = 0;
}
