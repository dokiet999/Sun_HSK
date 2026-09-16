package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "sentence_ordering_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SentenceOrderingToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    SentenceOrderingExercise sentenceOrderingExercise;

    /** Token chữ Hán (ví dụ: "请", "认真", "填写"...) */
    @Column(nullable = false, length = 50)
    String token;

    /** Thứ tự đúng ban đầu (0-indexed hoặc 1-indexed) */
    @Column(nullable = false)
    int position;
}
