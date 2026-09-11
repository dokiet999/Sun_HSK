package com.Kiet.Sun_HSK.service.strategy;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CharacterLevelTokenizationStrategy implements ChineseTokenizationStrategy {

    @Override
    public List<String> tokenize(String sentence, int hskLevel) {
        if (sentence == null || sentence.isBlank()) {
            return List.of();
        }

        // Loại bỏ dấu câu phổ biến ở cuối câu để bài sắp xếp câu tự nhiên hơn
        String clean = sentence.trim().replaceAll("[。？！!?,，\\s]+$", "");

        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < clean.length(); i++) {
            char ch = clean.charAt(i);
            if (!Character.isWhitespace(ch)) {
                tokens.add(String.valueOf(ch));
            }
        }
        return tokens;
    }
}
