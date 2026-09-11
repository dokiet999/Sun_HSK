package com.Kiet.Sun_HSK.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "listening_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ListeningExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false, unique = true)
    Exercise exercise;

    /**
     * Lấy trực tiếp audio_path từ câu ví dụ (hoặc từ vựng) qua quan hệ cha:
     * exercise.getExample().getAudioPath()
     */
    public String getAudioPath() {
        if (exercise != null && exercise.getExample() != null) {
            return exercise.getExample().getAudioPath();
        }
        if (exercise != null && exercise.getVocabulary() != null) {
            return exercise.getVocabulary().getAudioPath();
        }
        return null;
    }
}
