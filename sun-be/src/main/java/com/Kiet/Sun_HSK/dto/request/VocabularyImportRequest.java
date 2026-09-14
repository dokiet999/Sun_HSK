package com.Kiet.Sun_HSK.dto.request;

import com.Kiet.Sun_HSK.enums.HskVersion;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyImportRequest {

    Long id;

    @JsonProperty("hsk_version")
    HskVersion hskVersion;

    int level;

    String hanzi;

    String pinyin;

    /** Hán Việt */
    String hv;

    /** Từ loại (Động, Tính, Danh...) */
    String pos;

    @JsonProperty("meaning_vi")
    String meaningVi;

    String en;

    /**
     * Chuỗi collocation, ví dụ:
     * "填写表格 (điền biểu mẫu) / 填写信息 (điền thông tin) / 填写资料 (điền dữ liệu)"
     */
    String example;

    @JsonProperty("sort_order")
    int sortOrder;

    List<ExampleImportItem> examples;

    @JsonProperty("in_review_list")
    Boolean inReviewList;

    @JsonProperty("audio_path")
    String audioPath;

    @JsonProperty("shuffle_rank")
    Double shuffleRank;

    @JsonProperty("position")
    Integer position;

    @JsonProperty("lesson_number")
    Integer lessonNumber;

    @JsonProperty("words")
    private void unpackWords(VocabularyImportRequest words) {
        if (words != null) {
            if (this.id == null) this.id = words.id;
            if (this.hskVersion == null) this.hskVersion = words.hskVersion;
            if (this.level == 0) this.level = words.level;
            if (this.hanzi == null) this.hanzi = words.hanzi;
            if (this.pinyin == null) this.pinyin = words.pinyin;
            if (this.hv == null) this.hv = words.hv;
            if (this.pos == null) this.pos = words.pos;
            if (this.meaningVi == null) this.meaningVi = words.meaningVi;
            if (this.en == null) this.en = words.en;
            if (this.example == null) this.example = words.example;
            if (this.sortOrder == 0) this.sortOrder = words.sortOrder;
            if (this.examples == null) this.examples = words.examples;
            if (this.inReviewList == null) this.inReviewList = words.inReviewList;
            if (this.audioPath == null) this.audioPath = words.audioPath;
            if (this.shuffleRank == null) this.shuffleRank = words.shuffleRank;
            if (this.lessonNumber == null) this.lessonNumber = words.lessonNumber;
            if (this.position == null) this.position = words.position;
        }
    }

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ExampleImportItem {
        String zh;
        String vi;
        @JsonProperty("audio_path")
        String audioPath;
    }
}
