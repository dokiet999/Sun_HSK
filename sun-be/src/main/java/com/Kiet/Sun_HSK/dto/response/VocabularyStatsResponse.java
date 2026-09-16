package com.Kiet.Sun_HSK.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyStatsResponse {
    long totalWords;
    Map<Integer, Long> countsByLevel;
}
