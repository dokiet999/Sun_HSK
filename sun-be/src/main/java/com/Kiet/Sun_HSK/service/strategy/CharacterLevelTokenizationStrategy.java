package com.Kiet.Sun_HSK.service.strategy;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CharacterLevelTokenizationStrategy implements ChineseTokenizationStrategy {

    private static final java.util.regex.Pattern PUNCT_PATTERN = java.util.regex.Pattern.compile(
            "[\\s\\u3000-\\u303F\\uFF00-\\uFFEF\\u2000-\\u206F.,;:!?\"'()\\[\\]{}\\-—_]+"
    );

    @Override
    public List<String> tokenize(String sentence, int hskLevel) {
        if (sentence == null || sentence.isBlank()) {
            return List.of();
        }

        String clean = PUNCT_PATTERN.matcher(sentence.trim()).replaceAll("");

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
