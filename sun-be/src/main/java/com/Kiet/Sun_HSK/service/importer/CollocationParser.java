package com.Kiet.Sun_HSK.service.importer;

import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.entity.VocabularyCollocation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pure parser tách chuỗi collocation.
 * Ví dụ: "填写表格 (điền biểu mẫu) / 填写信息 (điền thông tin) / 填写资料 (điền dữ liệu)"
 * Hỗ trợ cả ngoặc nửa góc () và ngoặc nguyên góc tiếng Trung （）.
 */
@Component
public class CollocationParser {

    private static final Pattern PAREN_PATTERN = Pattern.compile("^(.+?)\\s*[\\(（](.+?)[\\)）]$");

    public List<VocabularyCollocation> parse(Vocabulary vocabulary, String rawCollocationString) {
        if (rawCollocationString == null || rawCollocationString.isBlank()) {
            return Collections.emptyList();
        }

        List<VocabularyCollocation> result = new ArrayList<>();
        String[] parts = rawCollocationString.split("\\s*/\\s*");

        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            Matcher matcher = PAREN_PATTERN.matcher(trimmed);
            String text;
            String meaningVi = null;

            if (matcher.find()) {
                text = matcher.group(1).trim();
                meaningVi = matcher.group(2).trim();
            } else {
                text = trimmed;
            }

            VocabularyCollocation collocation = VocabularyCollocation.builder()
                    .vocabulary(vocabulary)
                    .text(text)
                    .meaningVi(meaningVi)
                    .build();

            result.add(collocation);
        }

        return result;
    }
}
