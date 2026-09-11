package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.response.UserVocabularyResponse;
import com.Kiet.Sun_HSK.entity.User;
import com.Kiet.Sun_HSK.entity.UserVocabulary;
import com.Kiet.Sun_HSK.entity.Vocabulary;
import com.Kiet.Sun_HSK.enums.VocabularyLearningStatus;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.UserRepository;
import com.Kiet.Sun_HSK.repository.UserVocabularyRepository;
import com.Kiet.Sun_HSK.repository.VocabularyRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserVocabularyService {

    UserVocabularyRepository userVocabularyRepository;
    VocabularyRepository vocabularyRepository;
    UserRepository userRepository;

    // Khoảng thời gian lặp lại SM-2 theo số lần nhớ đúng liên tiếp (tính bằng ngày)
    private static final int[] SRS_INTERVAL_DAYS = {1, 2, 4, 7, 15, 30};

    @Transactional
    public UserVocabularyResponse startLearning(UUID userId, Long vocabId) {
        User user = getUser(userId);
        Vocabulary vocab = getVocabulary(vocabId);

        UserVocabulary userVocab = userVocabularyRepository.findByUserIdAndVocabularyId(userId, vocabId)
                .orElseGet(() -> {
                    UserVocabulary uv = UserVocabulary.builder()
                            .user(user)
                            .vocabulary(vocab)
                            .status(VocabularyLearningStatus.LEARNING)
                            .inReviewList(false)
                            .lastReviewedAt(LocalDateTime.now())
                            .nextReviewAt(LocalDateTime.now().plusDays(1))
                            .reviewCount(0)
                            .correctCount(0)
                            .wrongCount(0)
                            .build();
                    return userVocabularyRepository.save(uv);
                });

        return mapToResponse(userVocab);
    }

    @Transactional
    public UserVocabularyResponse toggleReviewList(UUID userId, Long vocabId, boolean inReviewList) {
        User user = getUser(userId);
        Vocabulary vocab = getVocabulary(vocabId);

        UserVocabulary userVocab = userVocabularyRepository.findByUserIdAndVocabularyId(userId, vocabId)
                .orElseGet(() -> UserVocabulary.builder()
                        .user(user)
                        .vocabulary(vocab)
                        .status(VocabularyLearningStatus.NEW)
                        .inReviewList(inReviewList)
                        .build());

        userVocab.setInReviewList(inReviewList);
        return mapToResponse(userVocabularyRepository.save(userVocab));
    }

    /**
     * Ghi nhận đánh giá độ nhớ thẻ flashcard (SRS).
     * Rating: 1 = Again (Quên), 2 = Hard (Khó), 3 = Good (Nhớ tốt), 4 = Easy (Dễ)
     */
    @Transactional
    public UserVocabularyResponse recordReviewRating(UUID userId, Long vocabId, int rating) {
        User user = getUser(userId);
        Vocabulary vocab = getVocabulary(vocabId);

        UserVocabulary userVocab = userVocabularyRepository.findByUserIdAndVocabularyId(userId, vocabId)
                .orElseGet(() -> UserVocabulary.builder()
                        .user(user)
                        .vocabulary(vocab)
                        .status(VocabularyLearningStatus.LEARNING)
                        .inReviewList(false)
                        .build());

        LocalDateTime now = LocalDateTime.now();
        userVocab.setLastReviewedAt(now);

        if (rating <= 1) {
            // Quên từ vựng: reset về 1 ngày và tăng wrongCount
            userVocab.setWrongCount(userVocab.getWrongCount() + 1);
            userVocab.setNextReviewAt(now.plusDays(1));
            userVocab.setStatus(VocabularyLearningStatus.LEARNING);
        } else {
            // Nhớ từ: tăng correctCount và tính ngày review tiếp theo
            int count = userVocab.getReviewCount();
            int days = SRS_INTERVAL_DAYS[Math.min(count, SRS_INTERVAL_DAYS.length - 1)];

            // Rating 4 (Easy) cộng thêm 1 ngày
            if (rating == 4) {
                days += 1;
            }

            userVocab.setCorrectCount(userVocab.getCorrectCount() + 1);
            userVocab.setReviewCount(count + 1);
            userVocab.setNextReviewAt(now.plusDays(days));

            if (userVocab.getReviewCount() >= 5) {
                userVocab.setStatus(VocabularyLearningStatus.MASTERED);
            } else {
                userVocab.setStatus(VocabularyLearningStatus.REVIEWING);
            }
        }

        return mapToResponse(userVocabularyRepository.save(userVocab));
    }

    @Transactional(readOnly = true)
    public List<UserVocabularyResponse> getDueForReview(UUID userId) {
        return userVocabularyRepository.findDueForReview(userId, LocalDateTime.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserVocabularyResponse> getMyReviewList(UUID userId, int level) {
        return userVocabularyRepository.findByUserIdAndInReviewListAndLevel(userId, level).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getLearningSummary(UUID userId, int level) {
        List<Object[]> rows = userVocabularyRepository.countStatusByUserIdAndLevel(userId, level);
        Map<String, Long> summary = new LinkedHashMap<>();

        for (VocabularyLearningStatus st : VocabularyLearningStatus.values()) {
            summary.put(st.name(), 0L);
        }

        for (Object[] r : rows) {
            VocabularyLearningStatus st = (VocabularyLearningStatus) r[0];
            Long cnt = (Long) r[1];
            summary.put(st.name(), cnt);
        }

        return summary;
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Vocabulary getVocabulary(Long vocabId) {
        return vocabularyRepository.findById(vocabId)
                .orElseThrow(() -> new AppException(ErrorCode.VOCABULARY_NOT_FOUND));
    }

    private UserVocabularyResponse mapToResponse(UserVocabulary uv) {
        Vocabulary v = uv.getVocabulary();
        return UserVocabularyResponse.builder()
                .id(uv.getId())
                .vocabularyId(v.getId())
                .hanzi(v.getHanzi())
                .pinyin(v.getPinyin())
                .meaningVi(v.getMeaningVi())
                .audioPath(v.getAudioPath())
                .hskLevel(v.getHskLevel())
                .status(uv.getStatus())
                .inReviewList(uv.getInReviewList())
                .lastReviewedAt(uv.getLastReviewedAt())
                .nextReviewAt(uv.getNextReviewAt())
                .reviewCount(uv.getReviewCount())
                .correctCount(uv.getCorrectCount())
                .wrongCount(uv.getWrongCount())
                .build();
    }
}
