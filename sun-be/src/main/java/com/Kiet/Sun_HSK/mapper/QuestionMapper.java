package com.Kiet.Sun_HSK.mapper;

import com.Kiet.Sun_HSK.dto.request.CreateQuestionRequest;
import com.Kiet.Sun_HSK.dto.request.UpdateQuestionRequest;
import com.Kiet.Sun_HSK.dto.response.QuestionOptionResponse;
import com.Kiet.Sun_HSK.dto.response.QuestionResponse;
import com.Kiet.Sun_HSK.entity.Question;
import com.Kiet.Sun_HSK.entity.QuestionOption;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface QuestionMapper {
    Question toQuestion(CreateQuestionRequest request);
    QuestionResponse toQuestionResponse(Question question);
    QuestionOptionResponse toOptionResponse(QuestionOption option);
    @BeanMapping(
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    void updateQuestion(UpdateQuestionRequest request, @MappingTarget Question question);
}
