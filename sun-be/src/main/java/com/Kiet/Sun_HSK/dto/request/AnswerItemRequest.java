package com.Kiet.Sun_HSK.dto.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnswerItemRequest {

    UUID questionId;

    /** Multiple Choice, True/False, Picture Selection, Dialogue */
    UUID selectedOptionId;

    /** Fill-in-blank, Writing */
    String textAnswer;

    /**
     * Matching: key = optionId của vế trái, value = matchKey của vế phải.
     * Ví dụ: {"uuid-option-A": "1", "uuid-option-B": "3"}
     */
    Map<String, String> matchPairs;

    /**
     * Sentence Ordering: danh sách option UUID theo thứ tự user đã sắp xếp.
     * Ví dụ: ["uuid1", "uuid2", "uuid3"]
     */
    List<String> orderAnswer;
}
