package com.Kiet.Sun_HSK.dto.response;

import com.Kiet.Sun_HSK.enums.HskVersion;
import com.Kiet.Sun_HSK.enums.VocabularyLearningStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyResponse {

    Long id;

    HskVersion hskVersion;

    int hskLevel;

    Integer lessonNumber;

    Integer position;

    String hanzi;

    String pinyin;

    String hanViet;

    String pos;

    String meaningVi;

    String meaningEn;

    String audioPath;

    int sortOrder;

    Boolean defaultInReviewList;

    Double shuffleRank;

    List<VocabularyCollocationResponse> collocations;

    List<VocabularyExampleResponse> examples;

    /** Trạng thái học cá nhân của user (nếu request đã được xác thực) */
    VocabularyLearningStatus userStatus;

    /** Cờ ghim review riêng của user */
    Boolean inReviewList;
}
