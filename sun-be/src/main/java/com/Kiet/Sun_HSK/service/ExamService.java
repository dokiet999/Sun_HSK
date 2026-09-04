package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.*;
import com.Kiet.Sun_HSK.dto.response.*;
import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.AttemptStatus;
import com.Kiet.Sun_HSK.enums.ExamStatus;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.exception.ErrorCode;
import com.Kiet.Sun_HSK.mapper.ExamMapper;
import com.Kiet.Sun_HSK.mapper.OptionMapper;
import com.Kiet.Sun_HSK.mapper.QuestionMapper;
import com.Kiet.Sun_HSK.mapper.SectionMapper;
import com.Kiet.Sun_HSK.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExamService {

    ExamRepository examRepository;
    ExamSectionRepository sectionRepository;
    QuestionRepository questionRepository;
    QuestionOptionRepository optionRepository;
    ExamAttemptRepository attemptRepository;
    UserRepository userRepository;

    ExamMapper examMapper;
    SectionMapper sectionMapper;
    QuestionMapper questionMapper;
    OptionMapper optionMapper;
    // ── User: List & Detail ───────────────────────────────────────────────────

    public Page<ExamSummaryResponse> listPublished(Pageable pageable, String email) {
        UUID userId = null;
        if (email != null) {
            userId = userRepository.findByEmail(email)
                    .map(User::getId)
                    .orElse(null);
        }
        final UUID finalUserId = userId;
        return examRepository.findByDeletedAtIsNullAndStatus(ExamStatus.PUBLISHED, pageable)
                .map(exam -> toSummary(exam, finalUserId));
    }

    public ExamDetailResponse getDetail(UUID examId) {
        Exam exam = examRepository.findByIdAndDeletedAtIsNullAndStatus(examId, ExamStatus.PUBLISHED)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
        return buildDetail(exam);
    }

    // ── Admin: CRUD ───────────────────────────────────────────────────────────

    @Transactional
    public ExamSummaryResponse createExam(CreateExamRequest req) {
        Exam exam = examMapper.toExam(req);
        return toSummary(examRepository.save(exam), null);
    }

    @Transactional
    public ExamSummaryResponse publishExam(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
        exam.setStatus(ExamStatus.PUBLISHED);
        return toSummary(examRepository.save(exam), null);
    }

    @Transactional
    public ExamSummaryResponse updateExam(UUID examId, UpdateExamRequest req) {
        Exam exam = examRepository.findByIdAndDeletedAtIsNull(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        examMapper.updateExam(req, exam);

        return toSummary(examRepository.save(exam), null);
    }

    @Transactional
    public void deleteExam(UUID examId) {
        Exam exam = examRepository.findByIdAndDeletedAtIsNull(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
        examRepository.delete(exam);
    }

    // ── Admin: Sections ───────────────────────────────────────────────────────

    @Transactional
    public SectionResponse addSection(UUID examId, CreateSectionRequest req) {
        Exam exam = examRepository.findByIdAndDeletedAtIsNull(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        ExamSection section = sectionMapper.toExamSection(req);
        section.setExam(exam);

        return toSectionResponse(sectionRepository.save(section), List.of());
    }

    @Transactional
    public SectionResponse updateSection(UUID sectionId, UpdateSectionRequest req) {
        ExamSection section = sectionRepository.findByIdAndDeletedAtIsNull(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        sectionMapper.updateSection(req, section);

        return toSectionResponse(sectionRepository.save(section), List.of());
    }

    @Transactional
    public void deleteSection(UUID sectionId) {
        ExamSection section = sectionRepository.findByIdAndDeletedAtIsNull(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
        sectionRepository.delete(section);
    }

    // ── Admin: Questions ──────────────────────────────────────────────────────

    @Transactional
    public QuestionResponse addQuestion(UUID sectionId, CreateQuestionRequest req) {
        ExamSection section = sectionRepository.findByIdAndDeletedAtIsNull(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        Question question = questionMapper.toQuestion(req);
        question.setSection(section);

        Question saved = questionRepository.save(question);

        // Cập nhật tổng câu hỏi và điểm trên đề
        updateExamStats(section.getExam().getId());

        return toQuestionResponse(saved, List.of());
    }

    @Transactional
    public QuestionResponse updateQuestion(UUID questionId, UpdateQuestionRequest req) {
        Question question = questionRepository.findByIdAndDeletedAtIsNull(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        questionMapper.updateQuestion(req, question);

        Question saved = questionRepository.save(question);

        // Load lại options nếu có để trả về (hoặc tạm trả List.of() để tránh N+1)
        List<QuestionOption> options = optionRepository.findByQuestionIdInAndDeletedAtIsNull(List.of(saved.getId()));
        updateExamStats(saved.getSection().getExam().getId());

        return toQuestionResponse(saved, options);
    }

    @Transactional
    public void deleteQuestion(UUID questionId) {
        Question question = questionRepository.findByIdAndDeletedAtIsNull(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        UUID examId = question.getSection().getExam().getId();
        questionRepository.delete(question);
        updateExamStats(examId);
    }

    // ── Admin: Options ────────────────────────────────────────────────────────

    @Transactional
    public QuestionOptionResponse addOption(UUID questionId, CreateQuestionOptionRequest req) {
        Question question = questionRepository.findByIdAndDeletedAtIsNull(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        QuestionOption option = optionMapper.toQuestionOption(req);
        option.setQuestion(question);

        QuestionOption saved = optionRepository.save(option);
        return toOptionResponse(saved);
    }

    @Transactional
    public QuestionOptionResponse updateOption(UUID optionId, UpdateQuestionOptionRequest req) {
        QuestionOption option = optionRepository.findByIdAndDeletedAtIsNull(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND)); // Tạm dùng QUESTION_NOT_FOUND

        optionMapper.updateQuestionOption(req, option);

        return toOptionResponse(optionRepository.save(option));
    }

    @Transactional
    public void deleteOption(UUID optionId) {
        QuestionOption option = optionRepository.findByIdAndDeletedAtIsNull(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        optionRepository.delete(option);
    }

    // ── Admin: get all exams (including DRAFT) ────────────────────────────────

    public Page<ExamSummaryResponse> listAll(Pageable pageable) {
        return examRepository.findByDeletedAtIsNull(pageable)
                .map(exam -> toSummary(exam, null));
    }

    public ExamDetailResponse getDetailAdmin(UUID examId) {
        Exam exam = examRepository.findByIdAndDeletedAtIsNull(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
        return buildDetail(exam);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void updateExamStats(UUID examId) {
        long count = questionRepository.countByExamId(examId);
        Integer total = questionRepository.sumPointsByExamId(examId);
        examRepository.findByIdAndDeletedAtIsNull(examId).ifPresent(exam -> {
            exam.setTotalQuestions((int) count);
            exam.setTotalPoints(total != null ? total : 0);
            examRepository.save(exam);
        });
    }

    private ExamDetailResponse buildDetail(Exam exam) {
        List<ExamSection> sections = sectionRepository.findByExamIdAndDeletedAtIsNullOrderBySortOrder(exam.getId());
        List<UUID> sectionIds = sections.stream().map(ExamSection::getId).toList();
        List<Question> allQuestions = sectionIds.isEmpty()
                ? List.of()
                : questionRepository.findBySectionIdInAndDeletedAtIsNull(sectionIds);
        List<UUID> questionIds = allQuestions.stream().map(Question::getId).toList();
        List<QuestionOption> allOptions = questionIds.isEmpty()
                ? List.of()
                : optionRepository.findByQuestionIdInAndDeletedAtIsNull(questionIds);

        List<SectionResponse> sectionResponses = sections.stream()
                .map(section -> {
                    List<Question> sectionQuestions = allQuestions.stream()
                            .filter(q -> q.getSection().getId().equals(section.getId()))
                            .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                            .toList();

                    List<QuestionResponse> questionResponses = sectionQuestions.stream()
                            .map(q -> {
                                List<QuestionOption> opts = allOptions.stream()
                                        .filter(o -> o.getQuestion().getId().equals(q.getId()))
                                        .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                                        .toList();
                                return toQuestionResponse(q, opts);
                            })
                            .toList();

                    return toSectionResponse(section, questionResponses);
                })
                .toList();

        ExamDetailResponse response = examMapper.toDetail(exam);
        response.setSections(sectionResponses);
        return response;
    }

    private ExamSummaryResponse toSummary(Exam exam, UUID userId) {
        Double bestScore = null;
        if (userId != null) {
            bestScore = attemptRepository
                    .findTopByUserIdAndExamIdAndStatusOrderByTotalScoreDesc(
                            userId, exam.getId(), AttemptStatus.SUBMITTED)
                    .map(a -> a.getScorePercent().doubleValue())
                    .orElse(null);
        }

        ExamSummaryResponse response = examMapper.toSummary(exam);
        response.setBestScorePercent(bestScore);
        return response;
    }

    SectionResponse toSectionResponse(ExamSection section, List<QuestionResponse> questions) {
        SectionResponse response = sectionMapper.toSectionResponse(section);
        response.setQuestions(questions);
        return response;

    }

    QuestionResponse toQuestionResponse(Question q, List<QuestionOption> opts) {
        QuestionResponse response =
                questionMapper.toQuestionResponse(q);

        response.setOptions(
                opts.stream()
                        .map(questionMapper::toOptionResponse)
                        .toList()
        );

        return response;
    }

    QuestionOptionResponse toOptionResponse(QuestionOption o) {
        return questionMapper.toOptionResponse(o);
    }
}