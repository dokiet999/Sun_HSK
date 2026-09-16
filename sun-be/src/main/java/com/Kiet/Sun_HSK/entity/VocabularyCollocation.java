package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "vocabulary_collocations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyCollocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_id", nullable = false)
    Vocabulary vocabulary;

    /** Cụm từ tiếng Trung (ví dụ: "填写表格") */
    @Column(nullable = false, columnDefinition = "TEXT")
    String text;

    /** Nghĩa tiếng Việt của cụm từ (ví dụ: "điền biểu mẫu") */
    @Column(name = "meaning_vi", columnDefinition = "TEXT")
    String meaningVi;
}
