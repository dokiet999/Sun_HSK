package com.Kiet.Sun_HSK.service.generator;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class GenerateExercisesDataTest {

    @Autowired
    private ExerciseGenerationService exerciseGenerationService;

    @Test
    @DisplayName("Sinh dữ liệu bài tập cho HSK 1 và HSK 2 vào database")
    void generateExercisesForHsk1And2() {
        int count1 = exerciseGenerationService.generateForLevel(1);
        System.out.println(">>> Đã sinh bài tập HSK 1: " + count1);
        assertTrue(count1 > 0, "Phải sinh được bài tập cho HSK 1");

        int count2 = exerciseGenerationService.generateForLevel(2);
        System.out.println(">>> Đã sinh bài tập HSK 2: " + count2);
        assertTrue(count2 > 0, "Phải sinh được bài tập cho HSK 2");
    }
}
