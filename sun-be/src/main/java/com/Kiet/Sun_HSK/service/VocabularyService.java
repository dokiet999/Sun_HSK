package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.response.VocabularyCollocationResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyExampleResponse;
import com.Kiet.Sun_HSK.dto.response.VocabularyResponse;
import com.Kiet.Sun_HSK.entity.UserVocabulary;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.UserVocabularyRepository;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabularyService {

    VocabularyRepository vocabularyRepository;
    UserVocabularyRepository userVocabularyRepository;

    @Transactional(readOnly = true)
    public List<VocabularyResponse> getByLevel(int level, UUID userId) {
        List<Vocabulary> vocabs = vocabularyRepository.findByHskLevelWithDetails(level);

        // Nếu user đã đăng nhập, lấy kèm trạng thái học tập của user
        Map<Long, UserVocabulary> userVocabMap = new HashMap<>();
        if (userId != null) {
            List<UserVocabulary> userVocabs = userVocabularyRepository.findByUserIdAndStatus(userId, null);
            // lấy tất cả user_vocabularies của user
            for (Vocabulary v : vocabs) {
                userVocabularyRepository.findByUserIdAndVocabularyId(userId, v.getId())
                        .ifPresent(uv -> userVocabMap.put(v.getId(), uv));
            }
        }

        return vocabs.stream()
                .map(v -> mapToResponse(v, userVocabMap.get(v.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VocabularyResponse getById(Long id, UUID userId) {
        Vocabulary vocab = vocabularyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOCABULARY_NOT_FOUND));

        UserVocabulary userVocab = null;
        if (userId != null) {
            userVocab = userVocabularyRepository.findByUserIdAndVocabularyId(userId, id).orElse(null);
        }

        return mapToResponse(vocab, userVocab);
    }

    /**
     * Lấy tổng quan danh sách bài học của một HSK level (ví dụ chia 10 từ/bài),
     * kèm tiến độ học tập của từng bài cho user.
     */
    @Transactional(readOnly = true)
    public com.Kiet.Sun_HSK.dto.response.LessonOverviewResponse getLessonOverview(int level, int pageSize, UUID userId) {
        if (pageSize <= 0) pageSize = 10;

        Map<Long, com.Kiet.Sun_HSK.enums.VocabularyLearningStatus> userStatusMap = new HashMap<>();
        if (userId != null) {
            List<Object[]> rows = userVocabularyRepository.findStatusMapByUserIdAndLevel(userId, level);
            for (Object[] row : rows) {
                userStatusMap.put((Long) row[0], (com.Kiet.Sun_HSK.enums.VocabularyLearningStatus) row[1]);
            }
        }

        List<Integer> distinctLessons = vocabularyRepository.findDistinctLessonNumbersByHskLevel(level);
        if (!distinctLessons.isEmpty()) {
            List<com.Kiet.Sun_HSK.dto.response.LessonSummaryResponse> lessonSummaries = new ArrayList<>();
            long totalWords = 0;

            for (Integer lessonNum : distinctLessons) {
                List<Long> lessonIds = vocabularyRepository.findIdsByHskLevelAndLessonNumber(level, lessonNum);
                totalWords += lessonIds.size();
                int totalInLesson = lessonIds.size();
                int learned = 0;
                int mastered = 0;

                for (Long id : lessonIds) {
                    com.Kiet.Sun_HSK.enums.VocabularyLearningStatus st = userStatusMap.get(id);
                    if (st != null && st != com.Kiet.Sun_HSK.enums.VocabularyLearningStatus.NEW) {
                        learned++;
                    }
                    if (st == com.Kiet.Sun_HSK.enums.VocabularyLearningStatus.MASTERED) {
                        mastered++;
                    }
                }

                double percent = totalInLesson > 0 ? (learned * 100.0 / totalInLesson) : 0.0;
                boolean completed = totalInLesson > 0 && (mastered == totalInLesson || learned == totalInLesson);

                lessonSummaries.add(com.Kiet.Sun_HSK.dto.response.LessonSummaryResponse.builder()
                        .lessonNumber(lessonNum)
                        .title("Bài " + lessonNum)
                        .totalWords(totalInLesson)
                        .learnedWords(learned)
                        .masteredWords(mastered)
                        .progressPercent(Math.round(percent * 10.0) / 10.0)
                        .isCompleted(completed)
                        .build());
            }

            int avgWordsPerLesson = distinctLessons.isEmpty() ? pageSize : (int) Math.round((double) totalWords / distinctLessons.size());

            return com.Kiet.Sun_HSK.dto.response.LessonOverviewResponse.builder()
                    .level(level)
                    .totalWords(totalWords)
                    .wordsPerLesson(avgWordsPerLesson)
                    .totalLessons(distinctLessons.size())
                    .lessons(lessonSummaries)
                    .build();
        }

        List<Long> allIds = vocabularyRepository.findIdsByHskLevel(level);
        long totalWords = allIds.size();
        int totalLessons = (int) Math.ceil((double) totalWords / pageSize);

        List<com.Kiet.Sun_HSK.dto.response.LessonSummaryResponse> lessonSummaries = new ArrayList<>();
        for (int lessonNum = 1; lessonNum <= totalLessons; lessonNum++) {
            int start = (lessonNum - 1) * pageSize;
            int end = Math.min(start + pageSize, allIds.size());
            List<Long> lessonIds = allIds.subList(start, end);

            int totalInLesson = lessonIds.size();
            int learned = 0;
            int mastered = 0;

            for (Long id : lessonIds) {
                com.Kiet.Sun_HSK.enums.VocabularyLearningStatus st = userStatusMap.get(id);
                if (st != null && st != com.Kiet.Sun_HSK.enums.VocabularyLearningStatus.NEW) {
                    learned++;
                }
                if (st == com.Kiet.Sun_HSK.enums.VocabularyLearningStatus.MASTERED) {
                    mastered++;
                }
            }

            double percent = totalInLesson > 0 ? (learned * 100.0 / totalInLesson) : 0.0;
            boolean completed = totalInLesson > 0 && (mastered == totalInLesson || learned == totalInLesson);

            lessonSummaries.add(com.Kiet.Sun_HSK.dto.response.LessonSummaryResponse.builder()
                    .lessonNumber(lessonNum)
                    .title("Bài " + lessonNum)
                    .totalWords(totalInLesson)
                    .learnedWords(learned)
                    .masteredWords(mastered)
                    .progressPercent(Math.round(percent * 10.0) / 10.0)
                    .isCompleted(completed)
                    .build());
        }

        return com.Kiet.Sun_HSK.dto.response.LessonOverviewResponse.builder()
                .level(level)
                .totalWords(totalWords)
                .wordsPerLesson(pageSize)
                .totalLessons(totalLessons)
                .lessons(lessonSummaries)
                .build();
    }

    /**
     * Lấy danh sách từ vựng chi tiết của một bài học (theo lessonNumber và pageSize).
     */
    @Transactional(readOnly = true)
    public com.Kiet.Sun_HSK.dto.response.LessonVocabularyResponse getWordsByLesson(
            int level, int lessonNumber, int pageSize, UUID userId) {
        if (pageSize <= 0) pageSize = 10;
        if (lessonNumber < 1) lessonNumber = 1;

        List<Integer> distinctLessons = vocabularyRepository.findDistinctLessonNumbersByHskLevel(level);
        List<Long> lessonIds;
        int totalLessons;
        int wordsPerLesson;

        if (!distinctLessons.isEmpty()) {
            totalLessons = distinctLessons.size();
            lessonIds = vocabularyRepository.findIdsByHskLevelAndLessonNumber(level, lessonNumber);
            wordsPerLesson = lessonIds.size();
        } else {
            List<Long> allIds = vocabularyRepository.findIdsByHskLevel(level);
            long totalWords = allIds.size();
            totalLessons = (int) Math.ceil((double) totalWords / pageSize);
            wordsPerLesson = pageSize;

            int start = (lessonNumber - 1) * pageSize;
            if (start >= allIds.size()) {
                lessonIds = Collections.emptyList();
            } else {
                int end = Math.min(start + pageSize, allIds.size());
                lessonIds = allIds.subList(start, end);
            }
        }

        if (lessonIds.isEmpty()) {
            return com.Kiet.Sun_HSK.dto.response.LessonVocabularyResponse.builder()
                    .level(level)
                    .lessonNumber(lessonNumber)
                    .wordsPerLesson(wordsPerLesson)
                    .totalWordsInLesson(0)
                    .totalLessons(totalLessons)
                    .words(Collections.emptyList())
                    .build();
        }

        List<Vocabulary> vocabs = vocabularyRepository.findByIdsWithDetails(lessonIds);

        Map<Long, UserVocabulary> userVocabMap = new HashMap<>();
        if (userId != null) {
            List<UserVocabulary> userVocabs = userVocabularyRepository.findByUserIdAndVocabularyIdIn(userId, lessonIds);
            for (UserVocabulary uv : userVocabs) {
                userVocabMap.put(uv.getVocabulary().getId(), uv);
            }
        }

        List<VocabularyResponse> wordResponses = vocabs.stream()
                .map(v -> mapToResponse(v, userVocabMap.get(v.getId())))
                .collect(Collectors.toList());

        return com.Kiet.Sun_HSK.dto.response.LessonVocabularyResponse.builder()
                .level(level)
                .lessonNumber(lessonNumber)
                .wordsPerLesson(wordsPerLesson)
                .totalWordsInLesson(wordResponses.size())
                .totalLessons(totalLessons)
                .words(wordResponses)
                .build();
    }

    /**
     * Helper lấy danh sách ID từ vựng của một bài học (dùng cho ExerciseService).
     */
    @Transactional(readOnly = true)
    public List<Long> getLessonWordIds(int level, int lessonNumber, int pageSize) {
        List<Integer> distinctLessons = vocabularyRepository.findDistinctLessonNumbersByHskLevel(level);
        if (!distinctLessons.isEmpty()) {
            return vocabularyRepository.findIdsByHskLevelAndLessonNumber(level, lessonNumber);
        }

        if (pageSize <= 0) pageSize = 10;
        if (lessonNumber < 1) lessonNumber = 1;

        List<Long> allIds = vocabularyRepository.findIdsByHskLevel(level);
        int start = (lessonNumber - 1) * pageSize;
        if (start >= allIds.size()) {
            return Collections.emptyList();
        }
        int end = Math.min(start + pageSize, allIds.size());
        return allIds.subList(start, end);
    }

    public VocabularyResponse mapToResponse(Vocabulary vocab, UserVocabulary userVocab) {
        List<VocabularyCollocationResponse> collocations = vocab.getCollocations() != null
                ? vocab.getCollocations().stream()
                .map(c -> VocabularyCollocationResponse.builder()
                        .id(c.getId())
                        .text(c.getText())
                        .meaningVi(c.getMeaningVi())
                        .build())
                .collect(Collectors.toList())
                : Collections.emptyList();

        List<VocabularyExampleResponse> examples = vocab.getExamples() != null
                ? vocab.getExamples().stream()
                .map(e -> VocabularyExampleResponse.builder()
                        .id(e.getId())
                        .zh(e.getZh())
                        .vi(e.getVi())
                        .audioPath(e.getAudioPath())
                        .sortOrder(e.getSortOrder())
                        .build())
                .collect(Collectors.toList())
                : Collections.emptyList();

        return VocabularyResponse.builder()
                .id(vocab.getId())
                .hskLevel(vocab.getHskLevel())
                .lessonNumber(vocab.getLessonNumber())
                .position(vocab.getPosition())
                .hanzi(vocab.getHanzi())
                .pinyin(vocab.getPinyin())
                .hanViet(vocab.getHanViet())
                .pos(vocab.getPos())
                .meaningVi(vocab.getMeaningVi())
                .meaningEn(vocab.getMeaningEn())
                .audioPath(vocab.getAudioPath())
                .sortOrder(vocab.getSortOrder())
                .defaultInReviewList(vocab.getDefaultInReviewList())
                .shuffleRank(vocab.getShuffleRank())
                .collocations(collocations)
                .examples(examples)
                .userStatus(userVocab != null ? userVocab.getStatus() : null)
                .inReviewList(userVocab != null && userVocab.getInReviewList() != null ? userVocab.getInReviewList() : false)
                .build();
    }
}
