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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

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
    PlatformTransactionManager transactionManager;

    private TransactionTemplate requiresNewTx() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(Propagation.REQUIRES_NEW.value());
        return tx;
    }

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

        if (!belongsToAttemptExam(question, attempt)) {
            throw new AppException(ErrorCode.QUESTION_NOT_FOUND);
        }

        validateSelectedOption(question, req.getSelectedOptionId());
        upsertAnswer(attemptId, attempt, question, req);
    }

    // ── Nộp bài ───────────────────────────────────────────────────────────────

    @Transactional
    public AttemptResultResponse submitAttempt(UUID attemptId, String userEmail,
                                               SubmitAttemptRequest req) {
        ExamAttempt attempt = getValidAttempt(attemptId, userEmail);

        // Load toàn bộ section/câu hỏi/options của đề để chấm điểm (bulk, tránh N+1)
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

        // Load tất cả câu trả lời hiện có của attempt (1 query duy nhất)
        Map<UUID, AttemptAnswer> answerByQuestion = answerRepository.findByAttemptId(attemptId).stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a));

        // Áp câu trả lời từ request vào map trong bộ nhớ (không query/save riêng lẻ từng answer).
        // Chỉ chấp nhận answer cho câu hỏi thuộc chính đề thi này (questionMap), tránh nhận
        // questionId ngoài đề từ request.
        if (req.getAnswers() != null) {
            for (AnswerItemRequest answerReq : req.getAnswers()) {
                if (answerReq.getQuestionId() == null) continue;
                Question q = questionMap.get(answerReq.getQuestionId());
                if (q == null) throw new AppException(ErrorCode.QUESTION_NOT_FOUND);
                validateSelectedOption(q, answerReq.getSelectedOptionId(),
                        optionsByQuestion.getOrDefault(q.getId(), List.of()));
                AttemptAnswer answer = answerByQuestion.computeIfAbsent(q.getId(),
                        id -> AttemptAnswer.builder().attempt(attempt).question(q).build());
                applyAnswerRequest(answer, answerReq);
            }
        }

        int totalScore = 0;
        int listeningScore = 0;
        int readingScore = 0;
        int writingScore = 0;

        List<AttemptAnswerDetailResponse> details = new ArrayList<>();
        List<AttemptAnswer> toSave = new ArrayList<>();

        for (Question q : questions) {
            List<QuestionOption> opts = optionsByQuestion.getOrDefault(q.getId(), List.of());
            AttemptAnswer answer = answerByQuestion.computeIfAbsent(q.getId(),
                    id -> AttemptAnswer.builder().attempt(attempt).question(q).build());

            // Chấm điểm (1 lần duy nhất — không answer nào cũng được score() gán isCorrect=false/0)
            scoringService.score(answer, q, opts);
            toSave.add(answer);

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
        answerRepository.saveAll(toSave);

        // Tính % và pass/fail
        int totalPoints = attempt.getTotalPoints() > 0
                ? attempt.getTotalPoints()
                : attempt.getExam().getTotalPoints();
        BigDecimal scorePercent = totalPoints > 0
                ? BigDecimal.valueOf(totalScore * 100.0 / totalPoints).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        // So sánh bằng BigDecimal.compareTo thay vì intValue() để không cắt phần thập phân
        // (VD: 59.99% với passingScore=60 trước đây bị làm tròn xuống 59 → luôn trượt dù rất sát).
        boolean passed = scorePercent.compareTo(BigDecimal.valueOf(attempt.getExam().getPassingScore())) >= 0;

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

        return toAttemptResultResponse(attempt, details);
    }

    // ── Xem kết quả ───────────────────────────────────────────────────────────

    public AttemptResultResponse getResult(UUID attemptId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        ExamAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));

        if (attempt.getStatus() != AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_NOT_SUBMITTED);
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

        return toAttemptResultResponse(attempt, details);
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
        if (attempt.getStatus() == AttemptStatus.EXPIRED) {
            throw new AppException(ErrorCode.ATTEMPT_EXPIRED);
        }

        if (attempt.getExpiresAt() != null
                && LocalDateTime.now().isAfter(attempt.getExpiresAt())) {
            expireAttempt(attemptId);
            throw new AppException(ErrorCode.ATTEMPT_EXPIRED);
        }

        return attempt;
    }

    private void expireAttempt(UUID attemptId) {
        requiresNewTx().executeWithoutResult(status ->
                attemptRepository.findById(attemptId).ifPresent(attempt -> {
                    if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) {
                        attempt.setStatus(AttemptStatus.EXPIRED);
                        attemptRepository.save(attempt);
                    }
                }));
    }

    private AttemptResultResponse toAttemptResultResponse(
            ExamAttempt attempt, List<AttemptAnswerDetailResponse> details) {
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

    private AttemptAnswer upsertAnswer(UUID attemptId, ExamAttempt attempt, Question question,
                                       AnswerItemRequest req) {
        try {
            AttemptAnswer answer = answerRepository.findByAttemptIdAndQuestionId(attemptId, question.getId())
                    .orElseGet(() -> AttemptAnswer.builder().attempt(attempt).question(question).build());
            applyAnswerRequest(answer, req);
            return answerRepository.saveAndFlush(answer);
        } catch (DataIntegrityViolationException e) {
            AttemptAnswer existing = answerRepository.findByAttemptIdAndQuestionId(attemptId, question.getId())
                    .orElseThrow(() -> e);
            applyAnswerRequest(existing, req);
            return answerRepository.saveAndFlush(existing);
        }
    }

    private boolean belongsToAttemptExam(Question question, ExamAttempt attempt) {
        return question.getSection() != null
                && question.getSection().getExam() != null
                && question.getSection().getExam().getId().equals(attempt.getExam().getId());
    }

    private void validateSelectedOption(Question question, UUID selectedOptionId) {
        if (selectedOptionId == null) return;

        QuestionOption option = optionRepository.findByIdAndDeletedAtIsNull(selectedOptionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        if (option.getQuestion() == null || !option.getQuestion().getId().equals(question.getId())) {
            throw new AppException(ErrorCode.QUESTION_NOT_FOUND);
        }
    }

    private void validateSelectedOption(Question question, UUID selectedOptionId,
                                        List<QuestionOption> options) {
        if (selectedOptionId == null) return;

        boolean belongsToQuestion = options.stream()
                .anyMatch(option -> selectedOptionId.equals(option.getId()));
        if (!belongsToQuestion) {
            throw new AppException(ErrorCode.QUESTION_NOT_FOUND);
        }
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
