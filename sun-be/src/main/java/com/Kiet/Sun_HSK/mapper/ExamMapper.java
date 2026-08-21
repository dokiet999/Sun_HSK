package com.Kiet.Sun_HSK.mapper;

import com.Kiet.Sun_HSK.dto.request.CreateExamRequest;
import com.Kiet.Sun_HSK.dto.request.UpdateExamRequest;
import com.Kiet.Sun_HSK.dto.response.ExamDetailResponse;
import com.Kiet.Sun_HSK.dto.response.ExamSummaryResponse;
import com.Kiet.Sun_HSK.entity.Exam;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface ExamMapper {
    Exam toExam(CreateExamRequest createExamRequest);
    ExamSummaryResponse toSummary(Exam exam);
    ExamDetailResponse toDetail(Exam exam);
    @BeanMapping(
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    void updateExam(UpdateExamRequest updateExamRequest, @MappingTarget Exam exam);
}

