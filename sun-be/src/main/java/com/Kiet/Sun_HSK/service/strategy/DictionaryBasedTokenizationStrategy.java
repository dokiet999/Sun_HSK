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

    @Override
    public List<String> tokenize(String sentence, int hskLevel) {
        if (sentence == null || sentence.isBlank()) {
            return List.of();
        }

        // HSK 1: câu rất ngắn (3-5 chữ), ưu tiên tách ký tự hoặc cụm 2 chữ
        if (hskLevel == 1) {
            List<String> charTokens = characterLevelFallback.tokenize(sentence, hskLevel);
            if (charTokens.size() <= 6) {
                return charTokens;
            }
        }

        String clean = sentence.trim().replaceAll("[。？！!?,，\\s]+$", "");
        Set<String> dict = getDictionaryForLevel(hskLevel);

        if (dict.isEmpty()) {
            return characterLevelFallback.tokenize(clean, hskLevel);
        }

        List<String> tokens = new ArrayList<>();
        int i = 0;
        int n = clean.length();

        while (i < n) {
            char currentChar = clean.charAt(i);
            if (Character.isWhitespace(currentChar)) {
                i++;
                continue;
            }

            // Thử match từ dài nhất đến ngắn nhất
            int end = Math.min(i + MAX_WORD_LEN, n);
            boolean matched = false;

            for (int j = end; j > i + 1; j--) {
                String sub = clean.substring(i, j);
                if (dict.contains(sub)) {
                    tokens.add(sub);
                    i = j;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Ký tự đơn lẻ
                tokens.add(String.valueOf(currentChar));
                i++;
            }
        }

        return tokens;
    }

    private Set<String> getDictionaryForLevel(int level) {
        return dictionaryCache.computeIfAbsent(level, l -> {
            Set<String> set = new HashSet<>();
            // Lấy từ vựng tích lũy từ HSK 1 đến level hiện tại (giới hạn tối đa level 6)
            int targetLevel = Math.min(level, 6);
            for (int lv = 1; lv <= targetLevel; lv++) {
                List<Vocabulary> vocabs = vocabularyRepository.findByHskLevelOrderBySortOrderAsc(lv);
                for (Vocabulary v : vocabs) {
                    if (v.getHanzi() != null && !v.getHanzi().isBlank()) {
                        set.add(v.getHanzi().trim());
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
