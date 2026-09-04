package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.*;
import com.Kiet.Sun_HSK.dto.response.*;
import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.*;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.mapper.ExamMapper;
import com.Kiet.Sun_HSK.mapper.OptionMapper;
import com.Kiet.Sun_HSK.mapper.QuestionMapper;
import com.Kiet.Sun_HSK.mapper.SectionMapper;
import com.Kiet.Sun_HSK.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamServiceTest {

    @Mock
    private ExamRepository examRepository;
    @Mock
    private ExamSectionRepository sectionRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private QuestionOptionRepository optionRepository;
    @Mock
    private ExamAttemptRepository attemptRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExamMapper examMapper;
    @Mock
    private SectionMapper sectionMapper;
    @Mock
    private QuestionMapper questionMapper;
    @Mock
    private OptionMapper optionMapper;

    @InjectMocks
    private ExamService examService;

    private Exam exam;
    private UUID examId;

    @BeforeEach
    void setUp() {
        examId = UUID.randomUUID();
        exam = new Exam();
        exam.setId(examId);
        exam.setStatus(ExamStatus.DRAFT);
        exam.setTitle("Test Exam");
        exam.setTotalQuestions(0);
        exam.setTotalPoints(0);
    }

    @Test
    void listPublished_WithUserId_AddsBestScorePercent() {
        UUID userId = UUID.randomUUID();
        String email = "user@sunhsk.com";
        User mockUser = User.builder().id(userId).email(email).build();

        Pageable pageable = PageRequest.of(0, 10);
        ExamSummaryResponse mapped = summary(examId, "Test Exam");
        ExamAttempt attempt = new ExamAttempt();
        attempt.setScorePercent(BigDecimal.valueOf(88.50));

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));
        when(examRepository.findByDeletedAtIsNullAndStatus(ExamStatus.PUBLISHED, pageable))
                .thenReturn(new PageImpl<>(List.of(exam)));
        when(attemptRepository.findTopByUserIdAndExamIdAndStatusOrderByTotalScoreDesc(
                userId, examId, AttemptStatus.SUBMITTED))
                .thenReturn(Optional.of(attempt));
        when(examMapper.toSummary(exam)).thenReturn(mapped);

        Page<ExamSummaryResponse> result = examService.listPublished(pageable, email);

        assertEquals(1, result.getTotalElements());
        assertEquals(88.50, result.getContent().getFirst().getBestScorePercent());
    }

    @Test
    void listPublished_WithoutUserId_DoesNotLookupAttempt() {
        Pageable pageable = PageRequest.of(0, 10);

        when(examRepository.findByDeletedAtIsNullAndStatus(ExamStatus.PUBLISHED, pageable))
                .thenReturn(new PageImpl<>(List.of(exam)));
        when(examMapper.toSummary(exam)).thenReturn(summary(examId, "Test Exam"));

        Page<ExamSummaryResponse> result = examService.listPublished(pageable, null);

        assertEquals(1, result.getTotalElements());
        assertNull(result.getContent().getFirst().getBestScorePercent());
        verifyNoInteractions(attemptRepository);
    }

    @Test
    void getDetail_PublishedExam_BuildsSortedSectionsQuestionsAndOptions() {
        ExamSection section = section(UUID.randomUUID(), exam, 1);
        Question secondQuestion = question(UUID.randomUUID(), section, 2);
        Question firstQuestion = question(UUID.randomUUID(), section, 1);
        QuestionOption secondOption = option(UUID.randomUUID(), firstQuestion, 2);
        QuestionOption firstOption = option(UUID.randomUUID(), firstQuestion, 1);
        ExamDetailResponse detail = ExamDetailResponse.builder().id(examId).build();

        when(examRepository.findByIdAndDeletedAtIsNullAndStatus(examId, ExamStatus.PUBLISHED))
                .thenReturn(Optional.of(exam));
        when(sectionRepository.findByExamIdAndDeletedAtIsNullOrderBySortOrder(examId))
                .thenReturn(List.of(section));
        when(questionRepository.findBySectionIdInAndDeletedAtIsNull(List.of(section.getId())))
                .thenReturn(List.of(secondQuestion, firstQuestion));
        when(optionRepository.findByQuestionIdInAndDeletedAtIsNull(List.of(secondQuestion.getId(), firstQuestion.getId())))
                .thenReturn(List.of(secondOption, firstOption));
        when(examMapper.toDetail(exam)).thenReturn(detail);
        when(sectionMapper.toSectionResponse(section))
                .thenReturn(SectionResponse.builder().id(section.getId()).build());
        when(questionMapper.toQuestionResponse(firstQuestion))
                .thenReturn(QuestionResponse.builder().id(firstQuestion.getId()).sortOrder(1).build());
        when(questionMapper.toQuestionResponse(secondQuestion))
                .thenReturn(QuestionResponse.builder().id(secondQuestion.getId()).sortOrder(2).build());
        when(questionMapper.toOptionResponse(firstOption))
                .thenReturn(QuestionOptionResponse.builder().id(firstOption.getId()).sortOrder(1).build());
        when(questionMapper.toOptionResponse(secondOption))
                .thenReturn(QuestionOptionResponse.builder().id(secondOption.getId()).sortOrder(2).build());

        ExamDetailResponse result = examService.getDetail(examId);

        assertEquals(1, result.getSections().size());
        List<QuestionResponse> questions = result.getSections().getFirst().getQuestions();
        assertEquals(List.of(firstQuestion.getId(), secondQuestion.getId()),
                questions.stream().map(QuestionResponse::getId).toList());
        assertEquals(List.of(firstOption.getId(), secondOption.getId()),
                questions.getFirst().getOptions().stream().map(QuestionOptionResponse::getId).toList());
    }

    @Test
    void getDetail_NotFound_ThrowsException() {
        when(examRepository.findByIdAndDeletedAtIsNullAndStatus(examId, ExamStatus.PUBLISHED))
                .thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.getDetail(examId));
    }

    @Test
    void createExam_Success() {
        CreateExamRequest request = new CreateExamRequest();
        request.setTitle("Test Exam");
        ExamSummaryResponse mockResponse = summary(examId, "Test Exam");

        when(examMapper.toExam(request)).thenReturn(exam);
        when(examRepository.save(exam)).thenReturn(exam);
        when(examMapper.toSummary(exam)).thenReturn(mockResponse);

        ExamSummaryResponse result = examService.createExam(request);

        assertEquals(examId, result.getId());
        assertEquals("Test Exam", result.getTitle());
        verify(examRepository).save(exam);
    }

    @Test
    void publishExam_Success() {
        ExamSummaryResponse mockResponse = summary(examId, "Test Exam");
        mockResponse.setStatus(ExamStatus.PUBLISHED);

        when(examRepository.findById(examId)).thenReturn(Optional.of(exam));
        when(examRepository.save(exam)).thenReturn(exam);
        when(examMapper.toSummary(exam)).thenReturn(mockResponse);

        ExamSummaryResponse result = examService.publishExam(examId);

        assertEquals(ExamStatus.PUBLISHED, result.getStatus());
        assertEquals(ExamStatus.PUBLISHED, exam.getStatus());
    }

    @Test
    void publishExam_NotFound_ThrowsException() {
        when(examRepository.findById(examId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.publishExam(examId));
        verify(examRepository, never()).save(any(Exam.class));
    }

    @Test
    void updateExam_Success() {
        UpdateExamRequest request = new UpdateExamRequest();
        request.setTitle("Updated");
        ExamSummaryResponse mapped = summary(examId, "Updated");

        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.of(exam));
        when(examRepository.save(exam)).thenReturn(exam);
        when(examMapper.toSummary(exam)).thenReturn(mapped);

        ExamSummaryResponse result = examService.updateExam(examId, request);

        assertEquals("Updated", result.getTitle());
        verify(examMapper).updateExam(request, exam);
    }

    @Test
    void updateExam_NotFound_ThrowsException() {
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.updateExam(examId, new UpdateExamRequest()));
    }

    @Test
    void deleteExam_Success() {
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.of(exam));

        examService.deleteExam(examId);

        verify(examRepository).delete(exam);
    }

    @Test
    void deleteExam_NotFound_ThrowsException() {
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.deleteExam(examId));
        verify(examRepository, never()).delete(any(Exam.class));
    }

    @Test
    void addSection_Success() {
        CreateSectionRequest request = new CreateSectionRequest();
        ExamSection section = section(UUID.randomUUID(), null, 1);

        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.of(exam));
        when(sectionMapper.toExamSection(request)).thenReturn(section);
        when(sectionRepository.save(section)).thenReturn(section);
        when(sectionMapper.toSectionResponse(section))
                .thenReturn(SectionResponse.builder().id(section.getId()).build());

        SectionResponse result = examService.addSection(examId, request);

        assertEquals(section.getId(), result.getId());
        assertSame(exam, section.getExam());
    }

    @Test
    void addSection_ExamNotFound_ThrowsException() {
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.addSection(examId, new CreateSectionRequest()));
    }

    @Test
    void updateSection_Success() {
        UUID sectionId = UUID.randomUUID();
        ExamSection section = section(sectionId, exam, 1);
        UpdateSectionRequest request = new UpdateSectionRequest();

        when(sectionRepository.findByIdAndDeletedAtIsNull(sectionId)).thenReturn(Optional.of(section));
        when(sectionRepository.save(section)).thenReturn(section);
        when(sectionMapper.toSectionResponse(section))
                .thenReturn(SectionResponse.builder().id(sectionId).build());

        SectionResponse result = examService.updateSection(sectionId, request);

        assertEquals(sectionId, result.getId());
        verify(sectionMapper).updateSection(request, section);
    }

    @Test
    void updateSection_NotFound_ThrowsException() {
        UUID sectionId = UUID.randomUUID();
        when(sectionRepository.findByIdAndDeletedAtIsNull(sectionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.updateSection(sectionId, new UpdateSectionRequest()));
    }

    @Test
    void deleteSection_Success() {
        UUID sectionId = UUID.randomUUID();
        ExamSection section = section(sectionId, exam, 1);
        when(sectionRepository.findByIdAndDeletedAtIsNull(sectionId)).thenReturn(Optional.of(section));

        examService.deleteSection(sectionId);

        verify(sectionRepository).delete(section);
    }

    @Test
    void deleteSection_NotFound_ThrowsException() {
        UUID sectionId = UUID.randomUUID();
        when(sectionRepository.findByIdAndDeletedAtIsNull(sectionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.deleteSection(sectionId));
        verify(sectionRepository, never()).delete(any(ExamSection.class));
    }

    @Test
    void addQuestion_Success_UpdatesExamStats() {
        UUID sectionId = UUID.randomUUID();
        ExamSection section = section(sectionId, exam, 1);
        CreateQuestionRequest request = new CreateQuestionRequest();
        Question question = question(UUID.randomUUID(), null, 1);

        when(sectionRepository.findByIdAndDeletedAtIsNull(sectionId)).thenReturn(Optional.of(section));
        when(questionMapper.toQuestion(request)).thenReturn(question);
        when(questionRepository.save(question)).thenReturn(question);
        when(questionRepository.countByExamId(examId)).thenReturn(3L);
        when(questionRepository.sumPointsByExamId(examId)).thenReturn(12);
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.of(exam));
        when(questionMapper.toQuestionResponse(question))
                .thenReturn(QuestionResponse.builder().id(question.getId()).build());

        QuestionResponse result = examService.addQuestion(sectionId, request);

        assertEquals(question.getId(), result.getId());
        assertSame(section, question.getSection());
        assertEquals(3, exam.getTotalQuestions());
        assertEquals(12, exam.getTotalPoints());
        verify(examRepository).save(exam);
    }

    @Test
    void addQuestion_SectionNotFound_ThrowsException() {
        UUID sectionId = UUID.randomUUID();
        when(sectionRepository.findByIdAndDeletedAtIsNull(sectionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.addQuestion(sectionId, new CreateQuestionRequest()));
    }

    @Test
    void updateQuestion_Success_LoadsOptionsAndUpdatesExamStats() {
        UUID questionId = UUID.randomUUID();
        ExamSection section = section(UUID.randomUUID(), exam, 1);
        Question question = question(questionId, section, 1);
        QuestionOption option = option(UUID.randomUUID(), question, 1);
        UpdateQuestionRequest request = new UpdateQuestionRequest();

        when(questionRepository.findByIdAndDeletedAtIsNull(questionId)).thenReturn(Optional.of(question));
        when(questionRepository.save(question)).thenReturn(question);
        when(optionRepository.findByQuestionIdInAndDeletedAtIsNull(List.of(questionId))).thenReturn(List.of(option));
        when(questionRepository.countByExamId(examId)).thenReturn(1L);
        when(questionRepository.sumPointsByExamId(examId)).thenReturn(null);
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.of(exam));
        when(questionMapper.toQuestionResponse(question))
                .thenReturn(QuestionResponse.builder().id(questionId).build());
        when(questionMapper.toOptionResponse(option))
                .thenReturn(QuestionOptionResponse.builder().id(option.getId()).build());

        QuestionResponse result = examService.updateQuestion(questionId, request);

        assertEquals(questionId, result.getId());
        assertEquals(List.of(option.getId()), result.getOptions().stream().map(QuestionOptionResponse::getId).toList());
        assertEquals(1, exam.getTotalQuestions());
        assertEquals(0, exam.getTotalPoints());
        verify(questionMapper).updateQuestion(request, question);
    }

    @Test
    void updateQuestion_NotFound_ThrowsException() {
        UUID questionId = UUID.randomUUID();
        when(questionRepository.findByIdAndDeletedAtIsNull(questionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.updateQuestion(questionId, new UpdateQuestionRequest()));
    }

    @Test
    void deleteQuestion_Success_UpdatesExamStats() {
        UUID questionId = UUID.randomUUID();
        ExamSection section = section(UUID.randomUUID(), exam, 1);
        Question question = question(questionId, section, 1);

        when(questionRepository.findByIdAndDeletedAtIsNull(questionId)).thenReturn(Optional.of(question));
        when(questionRepository.countByExamId(examId)).thenReturn(0L);
        when(questionRepository.sumPointsByExamId(examId)).thenReturn(0);
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.of(exam));

        examService.deleteQuestion(questionId);

        verify(questionRepository).delete(question);
        assertEquals(0, exam.getTotalQuestions());
        assertEquals(0, exam.getTotalPoints());
    }

    @Test
    void deleteQuestion_NotFound_ThrowsException() {
        UUID questionId = UUID.randomUUID();
        when(questionRepository.findByIdAndDeletedAtIsNull(questionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.deleteQuestion(questionId));
        verify(questionRepository, never()).delete(any(Question.class));
    }

    @Test
    void addOption_Success() {
        UUID questionId = UUID.randomUUID();
        Question question = question(questionId, section(UUID.randomUUID(), exam, 1), 1);
        CreateQuestionOptionRequest request = new CreateQuestionOptionRequest();
        QuestionOption option = option(UUID.randomUUID(), null, 1);

        when(questionRepository.findByIdAndDeletedAtIsNull(questionId)).thenReturn(Optional.of(question));
        when(optionMapper.toQuestionOption(request)).thenReturn(option);
        when(optionRepository.save(option)).thenReturn(option);
        when(questionMapper.toOptionResponse(option))
                .thenReturn(QuestionOptionResponse.builder().id(option.getId()).build());

        QuestionOptionResponse result = examService.addOption(questionId, request);

        assertEquals(option.getId(), result.getId());
        assertSame(question, option.getQuestion());
    }

    @Test
    void addOption_QuestionNotFound_ThrowsException() {
        UUID questionId = UUID.randomUUID();
        when(questionRepository.findByIdAndDeletedAtIsNull(questionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.addOption(questionId, new CreateQuestionOptionRequest()));
    }

    @Test
    void updateOption_Success() {
        UUID optionId = UUID.randomUUID();
        QuestionOption option = option(optionId, question(UUID.randomUUID(), section(UUID.randomUUID(), exam, 1), 1), 1);
        UpdateQuestionOptionRequest request = new UpdateQuestionOptionRequest();

        when(optionRepository.findByIdAndDeletedAtIsNull(optionId)).thenReturn(Optional.of(option));
        when(optionRepository.save(option)).thenReturn(option);
        when(questionMapper.toOptionResponse(option))
                .thenReturn(QuestionOptionResponse.builder().id(optionId).build());

        QuestionOptionResponse result = examService.updateOption(optionId, request);

        assertEquals(optionId, result.getId());
        verify(optionMapper).updateQuestionOption(request, option);
    }

    @Test
    void updateOption_NotFound_ThrowsException() {
        UUID optionId = UUID.randomUUID();
        when(optionRepository.findByIdAndDeletedAtIsNull(optionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.updateOption(optionId, new UpdateQuestionOptionRequest()));
    }

    @Test
    void deleteOption_Success() {
        UUID optionId = UUID.randomUUID();
        QuestionOption option = option(optionId, question(UUID.randomUUID(), section(UUID.randomUUID(), exam, 1), 1), 1);
        when(optionRepository.findByIdAndDeletedAtIsNull(optionId)).thenReturn(Optional.of(option));

        examService.deleteOption(optionId);

        verify(optionRepository).delete(option);
    }

    @Test
    void deleteOption_NotFound_ThrowsException() {
        UUID optionId = UUID.randomUUID();
        when(optionRepository.findByIdAndDeletedAtIsNull(optionId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.deleteOption(optionId));
        verify(optionRepository, never()).delete(any(QuestionOption.class));
    }

    @Test
    void listAll_ReturnsNonDeletedExams() {
        Pageable pageable = PageRequest.of(0, 10);
        when(examRepository.findByDeletedAtIsNull(pageable)).thenReturn(new PageImpl<>(List.of(exam)));
        when(examMapper.toSummary(exam)).thenReturn(summary(examId, "Test Exam"));

        Page<ExamSummaryResponse> result = examService.listAll(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(examId, result.getContent().getFirst().getId());
    }

    @Test
    void getDetailAdmin_UsesNonDeletedExamRegardlessOfStatus() {
        ExamDetailResponse detail = ExamDetailResponse.builder().id(examId).build();

        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.of(exam));
        when(sectionRepository.findByExamIdAndDeletedAtIsNullOrderBySortOrder(examId)).thenReturn(List.of());
        when(examMapper.toDetail(exam)).thenReturn(detail);

        ExamDetailResponse result = examService.getDetailAdmin(examId);

        assertEquals(examId, result.getId());
        assertEquals(List.of(), result.getSections());
        verify(questionRepository, never()).findBySectionIdInAndDeletedAtIsNull(any());
        verify(optionRepository, never()).findByQuestionIdInAndDeletedAtIsNull(any());
    }

    @Test
    void getDetailAdmin_NotFound_ThrowsException() {
        when(examRepository.findByIdAndDeletedAtIsNull(examId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> examService.getDetailAdmin(examId));
    }

    private ExamSummaryResponse summary(UUID id, String title) {
        ExamSummaryResponse response = new ExamSummaryResponse();
        response.setId(id);
        response.setTitle(title);
        return response;
    }

    private ExamSection section(UUID id, Exam parentExam, int sortOrder) {
        ExamSection section = new ExamSection();
        section.setId(id);
        section.setExam(parentExam);
        section.setSortOrder(sortOrder);
        return section;
    }

    private Question question(UUID id, ExamSection section, int sortOrder) {
        Question question = new Question();
        question.setId(id);
        question.setSection(section);
        question.setSortOrder(sortOrder);
        question.setPoints(1);
        return question;
    }

    private QuestionOption option(UUID id, Question question, int sortOrder) {
        QuestionOption option = new QuestionOption();
        option.setId(id);
        option.setQuestion(question);
        option.setSortOrder(sortOrder);
        return option;
    }
}
