package com.Kiet.Sun_HSK.service.strategy;

import java.util.List;

public interface ChineseTokenizationStrategy {

    /**
     * Tách câu tiếng Trung thành danh sách các token ngữ nghĩa phục vụ bài tập sắp xếp câu.
     *
     * @param sentence Câu tiếng Trung gốc (ví dụ: "请认真填写这张报名表。")
     * @param hskLevel Cấp độ HSK (1-6) để áp dụng độ chi tiết phù hợp
     * @return Danh sách các token (ví dụ: ["请", "认真", "填写", "这张", "报名表"])
     */
    List<String> tokenize(String sentence, int hskLevel);
}
