package com.Kiet.Sun_HSK.service.importer;

import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.entity.VocabularyCollocation;
import com.Kiet.Sun_HSK.repository.VocabularyCollocationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabularyImportService {

    VocabularyImporter vocabularyImporter;
    CollocationParser collocationParser;
    VocabularyCollocationRepository vocabularyCollocationRepository;
    ExampleImporter exampleImporter;

    @Transactional
    public int importBatch(List<VocabularyImportRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (VocabularyImportRequest req : requests) {
            if (req.getId() == null || req.getHanzi() == null) {
                log.warn("Bỏ qua từ vựng không hợp lệ: id={}, hanzi={}", req.getId(), req.getHanzi());
                continue;
            }

            // 1. Lưu Vocabulary
            Vocabulary vocab = vocabularyImporter.importVocabulary(req);

            // 2. Parse & lưu Collocations
            vocabularyCollocationRepository.deleteByVocabularyId(vocab.getId());
            List<VocabularyCollocation> collocations = collocationParser.parse(vocab, req.getExample());
            if (!collocations.isEmpty()) {
                vocabularyCollocationRepository.saveAll(collocations);
            }

            // 3. Lưu Examples
            exampleImporter.importExamples(vocab, req.getExamples());

            count++;
        }

        log.info("Đã import thành công {} từ vựng", count);
        return count;
    }

    @Transactional
    public int importBatch(List<VocabularyImportRequest> requests, Integer defaultLesson) {
        if (requests == null || requests.isEmpty()) {
            return 0;
        }
        if (defaultLesson != null && defaultLesson > 0) {
            for (VocabularyImportRequest req : requests) {
                if (req.getLessonNumber() == null) {
                    req.setLessonNumber(defaultLesson);
                }
            }
        }
        return importBatch(requests);
    }

    @Transactional
    public Vocabulary saveSingle(VocabularyImportRequest req) {
        Vocabulary vocab = vocabularyImporter.importVocabulary(req);
        vocabularyCollocationRepository.deleteByVocabularyId(vocab.getId());
        if (req.getExample() != null && !req.getExample().isBlank()) {
            List<VocabularyCollocation> collocations = collocationParser.parse(vocab, req.getExample());
            if (!collocations.isEmpty()) {
                vocabularyCollocationRepository.saveAll(collocations);
            }
        }
        exampleImporter.importExamples(vocab, req.getExamples());
        return vocab;
    }
}
