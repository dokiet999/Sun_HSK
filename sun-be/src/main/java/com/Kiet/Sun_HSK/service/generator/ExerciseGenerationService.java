package com.Kiet.Sun_HSK.service.generator;

import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.entity.VocabularyExample;
import com.Kiet.Sun_HSK.repository.ExerciseRepository;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExerciseGenerationService {

    VocabularyRepository vocabularyRepository;
    ExerciseRepository exerciseRepository;
    FillBlankGenerator fillBlankGenerator;
    SentenceOrderingGenerator sentenceOrderingGenerator;
    ListeningGenerator listeningGenerator;

    @Transactional
    public int generateForLevel(int level) {
        List<Vocabulary> vocabs = vocabularyRepository.findByHskLevelWithDetails(level);
        if (vocabs.isEmpty()) {
            log.warn("Không tìm thấy từ vựng nào thuộc HSK level {}", level);
            return 0;
        }

        int count = 0;
        for (Vocabulary vocab : vocabs) {
            // Xóa exercises cũ của từ vựng này trước khi sinh mới
            exerciseRepository.deleteByVocabularyId(vocab.getId());

            for (VocabularyExample example : vocab.getExamples()) {
                // 1. Sinh Fill Blank
                if (fillBlankGenerator.generate(vocab, example).isPresent()) {
                    count++;
                }

                // 2. Sinh Sentence Ordering
                if (sentenceOrderingGenerator.generate(vocab, example).isPresent()) {
                    count++;
                }

                // 3. Sinh Listening
                if (listeningGenerator.generate(vocab, example).isPresent()) {
                    count++;
                }
            }
        }

        log.info("Đã sinh thành công {} bài tập cho HSK level {}", count, level);
        return count;
    }

    @Transactional
    public int generateAllLevels() {
        List<Object[]> levelCounts = vocabularyRepository.countGroupByHskLevel();
        int total = 0;
        for (Object[] row : levelCounts) {
            Integer level = (Integer) row[0];
            if (level != null && level > 0) {
                total += generateForLevel(level);
            }
        }
        log.info("Đã sinh tổng cộng {} bài tập cho tất cả cấp độ HSK", total);
        return total;
    }
}
