package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.CreateExamRequest;
import com.Kiet.Sun_HSK.dto.request.CreateQuestionOptionRequest;
import com.Kiet.Sun_HSK.dto.request.CreateQuestionRequest;
import com.Kiet.Sun_HSK.dto.request.CreateSectionRequest;
import com.Kiet.Sun_HSK.dto.response.*;
import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.AttemptStatus;
import com.Kiet.Sun_HSK.enums.ExamStatus;
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

    // ── User: List & Detail ───────────────────────────────────────────────────

    public Page<ExamSummaryResponse> listPublished(Pageable pageable, UUID userId) {
        return examRepository.findByStatus(ExamStatus.PUBLISHED, pageable)
                .map(exam -> toSummary(exam, userId));
    }

    public ExamDetailResponse getDetail(UUID examId) {
        Exam exam = examRepository.findByIdAndStatus(examId, ExamStatus.PUBLISHED)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
        return buildDetail(exam);
    }

    // ── Admin: CRUD ───────────────────────────────────────────────────────────

    @Transactional
    public ExamSummaryResponse createExam(CreateExamRequest req) {
        Exam exam = Exam.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .hskVersion(req.getHskVersion())
                .hskLevel(req.getHskLevel())
                .examType(req.getExamType())
                .timeLimit(req.getTimeLimit())
                .passingScore(req.getPassingScore() != null ? req.getPassingScore() : 60)
                .status(ExamStatus.DRAFT)
                .build();
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
    public void deleteExam(UUID examId) {
        if (!examRepository.existsById(examId)) {
            throw new AppException(ErrorCode.EXAM_NOT_FOUND);
        }
        examRepository.deleteById(examId);
    }

    // ── Admin: Sections ───────────────────────────────────────────────────────

    @Transactional
    public SectionResponse addSection(UUID examId, CreateSectionRequest req) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        ExamSection section = ExamSection.builder()
                .exam(exam)
                .sectionType(req.getSectionType())
                .title(req.getTitle())
                .instructions(req.getInstructions())
                .timeLimit(req.getTimeLimit())
                .sortOrder(req.getSortOrder())
                .build();

        return toSectionResponse(sectionRepository.save(section), List.of());
    }

    // ── Admin: Questions ──────────────────────────────────────────────────────

    @Transactional
    public QuestionResponse addQuestion(UUID sectionId, CreateQuestionRequest req) {
        ExamSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        Question question = Question.builder()
                .section(section)
                .questionType(req.getQuestionType())
                .content(req.getContent())
                .audioUrl(req.getAudioUrl())
                .imageUrl(req.getImageUrl())
                .points(req.getPoints())
                .sortOrder(req.getSortOrder())
                .explanation(req.getExplanation())
                .correctAnswer(req.getCorrectAnswer())
                .build();

        Question saved = questionRepository.save(question);

        // Cập nhật tổng câu hỏi và điểm trên đề
        updateExamStats(section.getExam().getId());

        return toQuestionResponse(saved, List.of());
    }

    // ── Admin: Options ────────────────────────────────────────────────────────

    @Transactional
    public QuestionOptionResponse addOption(UUID questionId, CreateQuestionOptionRequest req) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        QuestionOption option = QuestionOption.builder()
                .question(question)
                .content(req.getContent())
                .imageUrl(req.getImageUrl())
                .isCorrect(req.isCorrect())
                .matchKey(req.getMatchKey())
                .sortOrder(req.getSortOrder())
                .build();

        QuestionOption saved = optionRepository.save(option);
        return toOptionResponse(saved);
    }

    // ── Admin: get all exams (including DRAFT) ────────────────────────────────

    public Page<ExamSummaryResponse> listAll(Pageable pageable) {
        return examRepository.findAll(pageable)
                .map(exam -> toSummary(exam, null));
    }

    public ExamDetailResponse getDetailAdmin(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
        return buildDetail(exam);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void updateExamStats(UUID examId) {
        long count = questionRepository.countByExamId(examId);
        Integer total = questionRepository.sumPointsByExamId(examId);
        examRepository.findById(examId).ifPresent(exam -> {
            exam.setTotalQuestions((int) count);
            exam.setTotalPoints(total != null ? total : 0);
            examRepository.save(exam);
        });
    }

    private ExamDetailResponse buildDetail(Exam exam) {
        List<ExamSection> sections = sectionRepository.findByExamIdOrderBySortOrder(exam.getId());
        List<UUID> sectionIds = sections.stream().map(ExamSection::getId).toList();
        List<Question> allQuestions = questionRepository.findBySectionIdIn(sectionIds);
        List<UUID> questionIds = allQuestions.stream().map(Question::getId).toList();
        List<QuestionOption> allOptions = questionIds.isEmpty()
                ? List.of()
                : optionRepository.findByQuestionIdIn(questionIds);

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

        return ExamDetailResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .hskVersion(exam.getHskVersion())
                .hskLevel(exam.getHskLevel())
                .examType(exam.getExamType())
                .timeLimit(exam.getTimeLimit())
                .totalQuestions(exam.getTotalQuestions())
                .totalPoints(exam.getTotalPoints())
                .passingScore(exam.getPassingScore())
                .sections(sectionResponses)
                .build();
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

        return ExamSummaryResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .hskVersion(exam.getHskVersion())
                .hskLevel(exam.getHskLevel())
                .examType(exam.getExamType())
                .timeLimit(exam.getTimeLimit())
                .totalQuestions(exam.getTotalQuestions())
                .totalPoints(exam.getTotalPoints())
                .passingScore(exam.getPassingScore())
                .status(exam.getStatus())
                .createdAt(exam.getCreatedAt())
                .bestScorePercent(bestScore)
                .build();
    }

    SectionResponse toSectionResponse(ExamSection section, List<QuestionResponse> questions) {
        return SectionResponse.builder()
                .id(section.getId())
                .sectionType(section.getSectionType())
                .title(section.getTitle())
                .instructions(section.getInstructions())
                .timeLimit(section.getTimeLimit())
                .sortOrder(section.getSortOrder())
                .questions(questions)
                .build();
    }

    QuestionResponse toQuestionResponse(Question q, List<QuestionOption> opts) {
        return QuestionResponse.builder()
                .id(q.getId())
                .questionType(q.getQuestionType())
                .content(q.getContent())
                .audioUrl(q.getAudioUrl())
                .imageUrl(q.getImageUrl())
                .points(q.getPoints())
                .sortOrder(q.getSortOrder())
                .options(opts.stream().map(this::toOptionResponse).collect(Collectors.toList()))
                .build();
    }

    QuestionOptionResponse toOptionResponse(QuestionOption o) {
        return QuestionOptionResponse.builder()
                .id(o.getId())
                .content(o.getContent())
                .imageUrl(o.getImageUrl())
                .matchKey(o.getMatchKey())
                .sortOrder(o.getSortOrder())
                .build();
    }
}
