package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.AnswerItemRequest;
import com.Kiet.Sun_HSK.dto.request.SubmitAttemptRequest;
import com.Kiet.Sun_HSK.dto.response.AttemptAnswerDetailResponse;
import com.Kiet.Sun_HSK.dto.response.AttemptHistoryResponse;
import com.Kiet.Sun_HSK.dto.response.AttemptResultResponse;
import com.Kiet.Sun_HSK.dto.response.AttemptStartResponse;
import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.AttemptStatus;
import com.Kiet.Sun_HSK.enums.ExamStatus;
import com.Kiet.Sun_HSK.enums.SectionType;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExamAttemptService {

    ExamRepository examRepository;
    ExamSectionRepository sectionRepository;
    QuestionRepository questionRepository;
    QuestionOptionRepository optionRepository;
    ExamAttemptRepository attemptRepository;
    AttemptAnswerRepository answerRepository;
    UserRepository userRepository;
    ExamScoringService scoringService;

    // ── Bắt đầu làm bài ──────────────────────────────────────────────────────

    @Transactional
    public AttemptStartResponse startAttempt(UUID examId, String userEmail) {
        Exam exam = examRepository.findByIdAndDeletedAtIsNullAndStatus(examId, ExamStatus.PUBLISHED)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(exam.getTimeLimit());

        ExamAttempt attempt = ExamAttempt.builder()
                .user(user)
                .exam(exam)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(now)
                .expiresAt(expiresAt)
                .totalPoints(exam.getTotalPoints())
                .build();

        ExamAttempt saved = attemptRepository.save(attempt);
        log.info("User {} started attempt {} for exam {}", userEmail, saved.getId(), examId);

        return AttemptStartResponse.builder()
                .attemptId(saved.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .timeLimitMinutes(exam.getTimeLimit())
                .startedAt(saved.getStartedAt())
                .expiresAt(saved.getExpiresAt())
                .build();
    }

    // ── Lưu câu trả lời realtime (từng câu) ──────────────────────────────────

    @Transactional
    public void saveAnswer(UUID attemptId, String userEmail, AnswerItemRequest req) {
        ExamAttempt attempt = getValidAttempt(attemptId, userEmail);

        Question question = questionRepository.findByIdAndDeletedAtIsNull(req.getQuestionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        // Upsert: tìm câu trả lời cũ hoặc tạo mới
        AttemptAnswer answer = answerRepository
                .findByAttemptIdAndQuestionId(attemptId, req.getQuestionId())
                .orElse(AttemptAnswer.builder()
                        .attempt(attempt)
                        .question(question)
                        .build());

        applyAnswerRequest(answer, req);
        answerRepository.save(answer);
    }

    // ── Nộp bài ───────────────────────────────────────────────────────────────

    @Transactional
    public AttemptResultResponse submitAttempt(UUID attemptId, String userEmail,
                                                SubmitAttemptRequest req) {
        ExamAttempt attempt = getValidAttempt(attemptId, userEmail);

        // Lưu tất cả câu trả lời từ request
        if (req.getAnswers() != null) {
            for (AnswerItemRequest answerReq : req.getAnswers()) {
                if (answerReq.getQuestionId() == null) continue;
                questionRepository.findByIdAndDeletedAtIsNull(answerReq.getQuestionId()).ifPresent(q -> {
                    AttemptAnswer answer = answerRepository
                            .findByAttemptIdAndQuestionId(attemptId, q.getId())
                            .orElse(AttemptAnswer.builder().attempt(attempt).question(q).build());
                    applyAnswerRequest(answer, answerReq);
                    answerRepository.save(answer);
                });
            }
        }

        // Load toàn bộ câu hỏi và options của đề để chấm điểm (bulk, tránh N+1)
        List<ExamSection> sections = sectionRepository
                .findByExamIdAndDeletedAtIsNullOrderBySortOrder(attempt.getExam().getId());
        List<UUID> sectionIds = sections.stream().map(ExamSection::getId).toList();
        List<Question> questions = sectionIds.isEmpty()
                ? List.of()
                : questionRepository.findBySectionIdInAndDeletedAtIsNull(sectionIds);
        List<UUID> questionIds = questions.stream().map(Question::getId).toList();
        List<QuestionOption> allOptions = questionIds.isEmpty()
                ? List.of()
                : optionRepository.findByQuestionIdInAndDeletedAtIsNull(questionIds);

        // Map để tra cứu nhanh
        Map<UUID, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        Map<UUID, List<QuestionOption>> optionsByQuestion = allOptions.stream()
                .collect(Collectors.groupingBy(o -> o.getQuestion().getId()));
        Map<UUID, ExamSection> sectionMap = sections.stream()
                .collect(Collectors.toMap(ExamSection::getId, s -> s));

        // Load tất cả câu trả lời của attempt và chấm điểm
        List<AttemptAnswer> answers = answerRepository.findByAttemptId(attemptId);
        Map<UUID, AttemptAnswer> answerByQuestion = answers.stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a));

        int totalScore = 0;
        int listeningScore = 0;
        int readingScore = 0;
        int writingScore = 0;

        List<AttemptAnswerDetailResponse> details = new ArrayList<>();

        for (Question q : questions) {
            AttemptAnswer answer = answerByQuestion.get(q.getId());
            List<QuestionOption> opts = optionsByQuestion.getOrDefault(q.getId(), List.of());

            if (answer == null) {
                // Không trả lời → 0 điểm
                answer = AttemptAnswer.builder()
                        .attempt(attempt)
                        .question(q)
                        .isCorrect(false)
                        .pointsEarned(0)
                        .build();
            }

            // Chấm điểm
            scoringService.score(answer, q, opts);
            answerRepository.save(answer);

            totalScore += answer.getPointsEarned();

            // Phân loại điểm theo phần thi
            ExamSection section = sectionMap.get(q.getSection().getId());
            if (section != null) {
                SectionType st = section.getSectionType();
                if (st == SectionType.LISTENING) listeningScore += answer.getPointsEarned();
                else if (st == SectionType.READING) readingScore += answer.getPointsEarned();
                else if (st == SectionType.WRITING) writingScore += answer.getPointsEarned();
            }

            details.add(buildAnswerDetail(answer, q, opts));
        }

        // Tính % và pass/fail
        int totalPoints = attempt.getTotalPoints() > 0
                ? attempt.getTotalPoints()
                : attempt.getExam().getTotalPoints();
        BigDecimal scorePercent = totalPoints > 0
                ? BigDecimal.valueOf(totalScore * 100.0 / totalPoints).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        boolean passed = scorePercent.intValue() >= attempt.getExam().getPassingScore();

        // Cập nhật attempt
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setTimeSpentSecs(req.getTimeSpentSecs());
        attempt.setTotalScore(totalScore);
        attempt.setTotalPoints(totalPoints);
        attempt.setScorePercent(scorePercent);
        attempt.setPassed(passed);
        attempt.setListeningScore(listeningScore);
        attempt.setReadingScore(readingScore);
        attempt.setWritingScore(writingScore);
        attemptRepository.save(attempt);

        log.info("Attempt {} submitted: {}/{} ({}%)", attemptId, totalScore, totalPoints, scorePercent);

        return AttemptResultResponse.builder()
                .attemptId(attempt.getId())
                .examId(attempt.getExam().getId())
                .examTitle(attempt.getExam().getTitle())
                .status(attempt.getStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .timeSpentSecs(attempt.getTimeSpentSecs())
                .totalScore(totalScore)
                .totalPoints(totalPoints)
                .scorePercent(scorePercent)
                .passed(passed)
                .listeningScore(listeningScore)
                .readingScore(readingScore)
                .writingScore(writingScore)
                .answers(details)
                .build();
    }

    // ── Xem kết quả ───────────────────────────────────────────────────────────

    public AttemptResultResponse getResult(UUID attemptId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        ExamAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));

        if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.ATTEMPT_ALREADY_SUBMITTED);
        }

        List<AttemptAnswer> answers = answerRepository.findByAttemptId(attemptId);
        List<UUID> questionIds = answers.stream()
                .map(a -> a.getQuestion().getId()).toList();
        List<QuestionOption> allOptions = questionIds.isEmpty()
                ? List.of()
                : optionRepository.findByQuestionIdInAndDeletedAtIsNull(questionIds);
        Map<UUID, List<QuestionOption>> optionsByQuestion = allOptions.stream()
                .collect(Collectors.groupingBy(o -> o.getQuestion().getId()));

        List<AttemptAnswerDetailResponse> details = answers.stream()
                .map(a -> buildAnswerDetail(a, a.getQuestion(),
                        optionsByQuestion.getOrDefault(a.getQuestion().getId(), List.of())))
                .toList();

        return AttemptResultResponse.builder()
                .attemptId(attempt.getId())
                .examId(attempt.getExam().getId())
                .examTitle(attempt.getExam().getTitle())
                .status(attempt.getStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .timeSpentSecs(attempt.getTimeSpentSecs())
                .totalScore(attempt.getTotalScore())
                .totalPoints(attempt.getTotalPoints())
                .scorePercent(attempt.getScorePercent())
                .passed(attempt.getPassed())
                .listeningScore(attempt.getListeningScore())
                .readingScore(attempt.getReadingScore())
                .writingScore(attempt.getWritingScore())
                .answers(details)
                .build();
    }

    // ── Lịch sử làm bài ──────────────────────────────────────────────────────

    public Page<AttemptHistoryResponse> getHistory(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return attemptRepository.findByUserIdOrderByStartedAtDesc(user.getId(), pageable)
                .map(this::toHistoryResponse);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ExamAttempt getValidAttempt(UUID attemptId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ExamAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));

        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_ALREADY_SUBMITTED);
        }

        if (attempt.getExpiresAt() != null
                && LocalDateTime.now().isAfter(attempt.getExpiresAt())) {
            attempt.setStatus(AttemptStatus.EXPIRED);
            attemptRepository.save(attempt);
            throw new AppException(ErrorCode.ATTEMPT_EXPIRED);
        }

        return attempt;
    }

    private void applyAnswerRequest(AttemptAnswer answer, AnswerItemRequest req) {
        answer.setSelectedOptionId(req.getSelectedOptionId());
        answer.setTextAnswer(req.getTextAnswer());
        answer.setMatchPairs(scoringService.toJson(req.getMatchPairs()));
        answer.setOrderAnswer(scoringService.toJson(req.getOrderAnswer()));
        answer.setAnsweredAt(LocalDateTime.now());
    }

    private AttemptAnswerDetailResponse buildAnswerDetail(
            AttemptAnswer answer, Question q, List<QuestionOption> opts) {

        // Tìm option đúng
        QuestionOption correctOpt = opts.stream()
                .filter(QuestionOption::isCorrect).findFirst().orElse(null);

        // Tìm option user đã chọn
        QuestionOption selectedOpt = answer.getSelectedOptionId() == null ? null
                : opts.stream()
                .filter(o -> o.getId().equals(answer.getSelectedOptionId()))
                .findFirst().orElse(null);

        // Build options with isCorrect (hiển thị sau nộp bài)
        List<AttemptAnswerDetailResponse.AnswerOptionDetailResponse> optDetails = opts.stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(o -> AttemptAnswerDetailResponse.AnswerOptionDetailResponse.builder()
                        .id(o.getId())
                        .content(o.getContent())
                        .imageUrl(o.getImageUrl())
                        .matchKey(o.getMatchKey())
                        .isCorrect(o.isCorrect())
                        .sortOrder(o.getSortOrder())
                        .build())
                .toList();

        return AttemptAnswerDetailResponse.builder()
                .questionId(q.getId())
                .questionType(q.getQuestionType())
                .questionContent(q.getContent())
                .explanation(q.getExplanation())
                .selectedOptionId(answer.getSelectedOptionId())
                .selectedOptionContent(selectedOpt != null ? selectedOpt.getContent() : null)
                .textAnswer(answer.getTextAnswer())
                .correctOptionId(correctOpt != null ? correctOpt.getId() : null)
                .correctOptionContent(correctOpt != null ? correctOpt.getContent() : null)
                .correctAnswer(q.getCorrectAnswer())
                .isCorrect(answer.getIsCorrect())
                .pointsEarned(answer.getPointsEarned())
                .totalPoints(q.getPoints())
                .options(optDetails)
                .build();
    }

    private AttemptHistoryResponse toHistoryResponse(ExamAttempt attempt) {
        return AttemptHistoryResponse.builder()
                .attemptId(attempt.getId())
                .examId(attempt.getExam().getId())
                .examTitle(attempt.getExam().getTitle())
                .hskVersion(attempt.getExam().getHskVersion())
                .hskLevel(attempt.getExam().getHskLevel())
                .examType(attempt.getExam().getExamType())
                .status(attempt.getStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .timeSpentSecs(attempt.getTimeSpentSecs())
                .totalScore(attempt.getTotalScore())
                .totalPoints(attempt.getTotalPoints())
                .scorePercent(attempt.getScorePercent())
                .passed(attempt.getPassed())
                .build();
    }
}
