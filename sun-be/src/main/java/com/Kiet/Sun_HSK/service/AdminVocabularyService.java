package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest;
import com.Kiet.Sun_HSK.dto.response.VocabularyResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyStatsResponse;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import com.Kiet.Sun_HSK.service.importer.VocabularyImportService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminVocabularyService {

    VocabularyRepository vocabularyRepository;
    VocabularyImportService vocabularyImportService;
    VocabularyService vocabularyService;

    @Transactional(readOnly = true)
    public Page<VocabularyResponse> searchVocabulary(Integer level, Integer lesson, String keyword, Pageable pageable) {
        Page<Vocabulary> page = vocabularyRepository.searchAdmin(level, lesson, keyword, pageable);
        return page.map(v -> vocabularyService.mapToResponse(v, null));
    }

    @Transactional(readOnly = true)
    public VocabularyResponse getVocabularyById(Long id) {
        Vocabulary vocab = vocabularyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOCABULARY_NOT_FOUND));
        return vocabularyService.mapToResponse(vocab, null);
    }

    @Transactional
    public VocabularyResponse createVocabulary(VocabularyImportRequest request) {
        if (request.getId() == null) {
            Long maxId = vocabularyRepository.findMaxId();
            request.setId(maxId + 1);
        }
        Vocabulary vocab = vocabularyImportService.saveSingle(request);
        Vocabulary fullVocab = vocabularyRepository.findByIdWithDetails(vocab.getId()).orElse(vocab);
        return vocabularyService.mapToResponse(fullVocab, null);
    }

    @Transactional
    public VocabularyResponse updateVocabulary(Long id, VocabularyImportRequest request) {
        if (!vocabularyRepository.existsById(id)) {
            throw new AppException(ErrorCode.VOCABULARY_NOT_FOUND);
        }
        request.setId(id);
        Vocabulary vocab = vocabularyImportService.saveSingle(request);
        Vocabulary fullVocab = vocabularyRepository.findByIdWithDetails(vocab.getId()).orElse(vocab);
        return vocabularyService.mapToResponse(fullVocab, null);
    }

    @Transactional
    public void deleteVocabulary(Long id) {
        if (!vocabularyRepository.existsById(id)) {
            throw new AppException(ErrorCode.VOCABULARY_NOT_FOUND);
        }
        vocabularyRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public VocabularyStatsResponse getVocabularyStats() {
        long totalWords = vocabularyRepository.count();
        List<Object[]> rows = vocabularyRepository.countGroupByHskLevel();
        Map<Integer, Long> countsByLevel = new LinkedHashMap<>();
        for (int i = 1; i <= 7; i++) {
            countsByLevel.put(i, 0L);
        }
        for (Object[] row : rows) {
            Integer level = (Integer) row[0];
            Long count = (Long) row[1];
            countsByLevel.put(level, count);
        }
        return VocabularyStatsResponse.builder()
                .totalWords(totalWords)
                .countsByLevel(countsByLevel)
                .build();
    }

    @Transactional
    public int importBatch(List<VocabularyImportRequest> requests, Integer defaultLesson) {
        return vocabularyImportService.importBatch(requests, defaultLesson);
    }
}
