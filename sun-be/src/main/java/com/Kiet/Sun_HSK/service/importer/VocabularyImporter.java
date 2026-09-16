package com.Kiet.Sun_HSK.service.importer;

import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.enums.HskVersion;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabularyImporter {

    VocabularyRepository vocabularyRepository;

    public Vocabulary importVocabulary(VocabularyImportRequest req) {
        Vocabulary vocab = vocabularyRepository.findById(req.getId())
                .orElseGet(() -> Vocabulary.builder().id(req.getId()).build());

        if (req.getHskVersion() != null) {
            vocab.setHskVersion(req.getHskVersion());
        } else if (vocab.getHskVersion() == null) {
            vocab.setHskVersion(HskVersion.HSK_2);
        }

        vocab.setHskLevel(req.getLevel());
        if (req.getLessonNumber() != null) {
            vocab.setLessonNumber(req.getLessonNumber());
        }
        if (req.getPosition() != null) {
            vocab.setPosition(req.getPosition());
        }
        vocab.setHanzi(req.getHanzi());
        vocab.setPinyin(req.getPinyin());
        vocab.setHanViet(req.getHv());
        vocab.setPos(req.getPos());
        vocab.setMeaningVi(req.getMeaningVi());
        vocab.setMeaningEn(req.getEn());
        vocab.setAudioPath(req.getAudioPath());
        vocab.setSortOrder(req.getSortOrder());
        vocab.setDefaultInReviewList(false);
        vocab.setShuffleRank(req.getShuffleRank() != null ? req.getShuffleRank() : 0.0);

        return vocabularyRepository.save(vocab);
    }
}
