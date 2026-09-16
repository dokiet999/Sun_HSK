package com.Kiet.Sun_HSK.service.strategy;

import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thuật toán phân đoạn từ tiếng Trung Max-Match (Forward Maximum Matching - FMM)
 * kết hợp từ điển từ vựng HSK từ database.
 */
@Component
@Primary
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DictionaryBasedTokenizationStrategy implements ChineseTokenizationStrategy {

    VocabularyRepository vocabularyRepository;
    CharacterLevelTokenizationStrategy characterLevelFallback;

    // Cache từ điển theo level: level -> Set<Hanzi>
    Map<Integer, Set<String>> dictionaryCache = new ConcurrentHashMap<>();

    private static final int MAX_WORD_LEN = 6;
    private static final java.util.regex.Pattern PUNCT_PATTERN = java.util.regex.Pattern.compile(
            "[\\s\\u3000-\\u303F\\uFF00-\\uFFEF\\u2000-\\u206F.,;:!?\"'()\\[\\]{}\\-—_]+"
    );

    @Override
    public List<String> tokenize(String sentence, int hskLevel) {
        if (sentence == null || sentence.isBlank()) {
            return List.of();
        }

        Set<String> dict = getDictionaryForLevel(hskLevel);
        if (dict.isEmpty()) {
            return characterLevelFallback.tokenize(sentence, hskLevel);
        }

        // Loại bỏ dấu câu và chia câu thành các mệnh đề
        String clean = PUNCT_PATTERN.matcher(sentence.trim()).replaceAll(" ").trim();
        if (clean.isEmpty()) {
            return List.of();
        }

        List<String> tokens = new ArrayList<>();
        String[] parts = clean.split("\\s+");

        for (String part : parts) {
            int i = 0;
            int n = part.length();

            while (i < n) {
                // Thử match từ dài nhất đến ngắn nhất
                int end = Math.min(i + MAX_WORD_LEN, n);
                boolean matched = false;

                for (int j = end; j > i + 1; j--) {
                    String sub = part.substring(i, j);
                    if (dict.contains(sub)) {
                        tokens.add(sub);
                        i = j;
                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    // Ký tự đơn lẻ
                    tokens.add(String.valueOf(part.charAt(i)));
                    i++;
                }
            }
        }

        return tokens;
    }

    private Set<String> getDictionaryForLevel(int level) {
        return dictionaryCache.computeIfAbsent(level, l -> {
            Set<String> set = new HashSet<>();
            // Lấy từ vựng tích lũy từ HSK 1 đến level hiện tại (giới hạn tối đa level 6)
            int targetLevel = Math.min(Math.max(level, 1), 6);
            for (int lv = 1; lv <= targetLevel; lv++) {
                List<Vocabulary> vocabs = vocabularyRepository.findByHskLevelOrderBySortOrderAsc(lv);
                for (Vocabulary v : vocabs) {
                    if (v.getHanzi() != null && !v.getHanzi().isBlank()) {
                        String hanzi = v.getHanzi().trim();
                        set.add(hanzi);
                        // Nếu có ngoặc đơn tùy chọn như 差（一）点儿 -> thêm cả bản rút gọn và đầy đủ
                        String cleanVariant = hanzi.replaceAll("[（(].*?[）)]", "").trim();
                        if (!cleanVariant.isEmpty()) {
                            set.add(cleanVariant);
                        }
                        String expandedVariant = hanzi.replaceAll("[（(]|[）)]", "").trim();
                        if (!expandedVariant.isEmpty()) {
                            set.add(expandedVariant);
                        }
                    }
                }
            }
            return set;
        });
    }

    public void clearCache() {
        dictionaryCache.clear();
    }
}
