package com.Kiet.Sun_HSK.service.importer;

import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest.ExampleImportItem;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.entity.VocabularyExample;
import com.Kiet.Sun_HSK.repository.VocabularyExampleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExampleImporter {

    VocabularyExampleRepository vocabularyExampleRepository;

    public List<VocabularyExample> importExamples(Vocabulary vocab, List<ExampleImportItem> items) {
        vocabularyExampleRepository.deleteByVocabularyId(vocab.getId());

        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        List<VocabularyExample> entities = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            ExampleImportItem item = items.get(i);
            if (item.getZh() == null || item.getZh().isBlank()) {
                continue;
            }

            VocabularyExample example = VocabularyExample.builder()
                    .vocabulary(vocab)
                    .zh(item.getZh().trim())
                    .vi(item.getVi() != null ? item.getVi().trim() : null)
                    .audioPath(item.getAudioPath() != null ? item.getAudioPath().trim() : null)
                    .sortOrder(i)
                    .build();

            entities.add(example);
        }

        return vocabularyExampleRepository.saveAll(entities);
    }
}
