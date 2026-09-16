package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "fill_blank_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FillBlankExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false, unique = true)
    Exercise exercise;

    /** Câu có chỗ trống "____" (ví dụ: "请认真____这张报名表。") */
    @Column(name = "blank_text", nullable = false, columnDefinition = "TEXT")
    String blankText;

    /** Từ cần điền (ví dụ: "填写") */
    @Column(nullable = false, columnDefinition = "TEXT")
    String answer;
}
