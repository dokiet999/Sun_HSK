package com.Kiet.Sun_HSK.service;

import com.Kiet.Sun_HSK.dto.request.AnswerItemRequest;
import com.Kiet.Sun_HSK.dto.request.SubmitAttemptRequest;
import com.Kiet.Sun_HSK.entity.*;
import com.Kiet.Sun_HSK.enums.AttemptStatus;
import com.Kiet.Sun_HSK.enums.ExamStatus;
import com.Kiet.Sun_HSK.enums.QuestionType;
import com.Kiet.Sun_HSK.enums.SectionType;
import com.Kiet.Sun_HSK.exception.AppException;
import com.Kiet.Sun_HSK.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamAttemptServiceTest {

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
    private AttemptAnswerRepository answerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExamScoringService scoringService;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock
    private TransactionStatus transactionStatus;

    @InjectMocks
    private ExamAttemptService examAttemptService;

    private UUID examId;
    private UUID userId;
    private UUID attemptId;
    private User user;
    private Exam exam;
    private ExamAttempt attempt;

    @BeforeEach
    void setUp() {
        examId = UUID.randomUUID();
        userId = UUID.randomUUID();
        attemptId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
        user.setEmail("student@test.com");

        exam = new Exam();
        exam.setId(examId);
        exam.setTitle("HSK Test");
        exam.setStatus(ExamStatus.PUBLISHED);
        exam.setTimeLimit(30);
        exam.setTotalPoints(10);
        exam.setPassingScore(60);

        attempt = ExamAttempt.builder()
                .id(attemptId)
                .user(user)
                .exam(exam)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now().minusMinutes(1))
                .expiresAt(LocalDateTime.now().plusMinutes(29))
                .totalPoints(10)
                .scorePercent(BigDecimal.ZERO)
                .build();
    }

    @Test
    void saveAnswer_QuestionOutsideAttemptExam_ThrowsException() {
        Question foreignQuestion = question(UUID.randomUUID(), section(UUID.randomUUID(), exam(UUID.randomUUID())));
        AnswerItemRequest request = answerRequest(foreignQuestion.getId(), null);
        mockValidAttempt();
        when(questionRepository.findByIdAndDeletedAtIsNull(foreignQuestion.getId()))
                .thenReturn(Optional.of(foreignQuestion));

        assertThrows(AppException.class,
                () -> examAttemptService.saveAnswer(attemptId, user.getEmail(), request));

        verify(answerRepository, never()).saveAndFlush(any());
    }

    @Test
    void saveAnswer_SelectedOptionOutsideQuestion_ThrowsException() {
        Question question = question(UUID.randomUUID(), section(UUID.randomUUID(), exam));
        Question otherQuestion = question(UUID.randomUUID(), section(UUID.randomUUID(), exam));
        QuestionOption selectedOption = option(UUID.randomUUID(), otherQuestion);
        AnswerItemRequest request = answerRequest(question.getId(), selectedOption.getId());

        mockValidAttempt();
        when(questionRepository.findByIdAndDeletedAtIsNull(question.getId())).thenReturn(Optional.of(question));
        when(optionRepository.findByIdAndDeletedAtIsNull(selectedOption.getId()))
                .thenReturn(Optional.of(selectedOption));

        assertThrows(AppException.class,
                () -> examAttemptService.saveAnswer(attemptId, user.getEmail(), request));

        verify(answerRepository, never()).saveAndFlush(any());
    }

    @Test
    void saveAnswer_WhenConcurrentInsertWins_ReloadsAndUpdatesExistingAnswer() {
        Question question = question(UUID.randomUUID(), section(UUID.randomUUID(), exam));
        QuestionOption selectedOption = option(UUID.randomUUID(), question);
        AttemptAnswer existing = AttemptAnswer.builder().attempt(attempt).question(question).build();
        AnswerItemRequest request = answerRequest(question.getId(), selectedOption.getId());

        mockValidAttempt();
        when(questionRepository.findByIdAndDeletedAtIsNull(question.getId())).thenReturn(Optional.of(question));
        when(optionRepository.findByIdAndDeletedAtIsNull(selectedOption.getId()))
                .thenReturn(Optional.of(selectedOption));
        when(answerRepository.findByAttemptIdAndQuestionId(attemptId, question.getId()))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(existing));
        when(answerRepository.saveAndFlush(any(AttemptAnswer.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"))
                .thenReturn(existing);

        examAttemptService.saveAnswer(attemptId, user.getEmail(), request);

        verify(answerRepository, times(2)).saveAndFlush(any(AttemptAnswer.class));
    }

    @Test
    void saveAnswer_ExpiredAttempt_PersistsExpiredInRequiresNewTransaction() {
        attempt.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        mockValidAttempt();
        when(transactionManager.getTransaction(any())).thenReturn(transactionStatus);
        when(attemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));

        assertThrows(AppException.class,
                () -> examAttemptService.saveAnswer(attemptId, user.getEmail(), answerRequest(UUID.randomUUID(), null)));

        verify(attemptRepository).save(attempt);
        verify(transactionManager).commit(transactionStatus);
    }

    @Test
    void submitAttempt_AnswerOutsideExam_IsIgnored() {
        ExamSection section = section(UUID.randomUUID(), exam);
        Question question = question(UUID.randomUUID(), section);
        AnswerItemRequest invalidAnswer = answerRequest(UUID.randomUUID(), null);
        SubmitAttemptRequest request = new SubmitAttemptRequest();
        request.setAnswers(List.of(invalidAnswer));

        mockValidAttempt();
        when(sectionRepository.findByExamIdAndDeletedAtIsNullOrderBySortOrder(examId)).thenReturn(List.of(section));
        when(questionRepository.findBySectionIdInAndDeletedAtIsNull(List.of(section.getId())))
                .thenReturn(List.of(question));
        when(optionRepository.findByQuestionIdInAndDeletedAtIsNull(List.of(question.getId()))).thenReturn(List.of());
        when(answerRepository.findByAttemptId(attemptId)).thenReturn(List.of());

        var response = examAttemptService.submitAttempt(attemptId, user.getEmail(), request);

        assertNotNull(response);
        verify(answerRepository).saveAll(any());
        verify(attemptRepository).save(argThat(a -> a.getStatus() == AttemptStatus.SUBMITTED));
    }

    @Test
    void getResult_WhenAttemptIsNotSubmitted_ThrowsException() {
        mockUser();
        when(attemptRepository.findByIdAndUserId(attemptId, userId)).thenReturn(Optional.of(attempt));

        assertThrows(AppException.class,
                () -> examAttemptService.getResult(attemptId, user.getEmail()));

        verify(answerRepository, never()).findByAttemptId(attemptId);
    }

    private void mockValidAttempt() {
        mockUser();
        when(attemptRepository.findByIdAndUserId(attemptId, userId)).thenReturn(Optional.of(attempt));
    }

    private void mockUser() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    private Exam exam(UUID id) {
        Exam exam = new Exam();
        exam.setId(id);
        return exam;
    }

    private ExamSection section(UUID id, Exam exam) {
        ExamSection section = new ExamSection();
        section.setId(id);
        section.setExam(exam);
        section.setSectionType(SectionType.READING);
        return section;
    }

    private Question question(UUID id, ExamSection section) {
        Question question = new Question();
        question.setId(id);
        question.setSection(section);
        question.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        question.setPoints(1);
        return question;
    }

    private QuestionOption option(UUID id, Question question) {
        QuestionOption option = new QuestionOption();
        option.setId(id);
        option.setQuestion(question);
        return option;
    }

    private AnswerItemRequest answerRequest(UUID questionId, UUID selectedOptionId) {
        AnswerItemRequest request = new AnswerItemRequest();
        request.setQuestionId(questionId);
        request.setSelectedOptionId(selectedOptionId);
        return request;
    }
}
