package com.Kiet.Sun_HSK.mapper;

import com.Kiet.Sun_HSK.dto.request.CreateQuestionOptionRequest;
import com.Kiet.Sun_HSK.dto.request.UpdateQuestionOptionRequest;
import com.Kiet.Sun_HSK.dto.request.UpdateQuestionRequest;
import com.Kiet.Sun_HSK.dto.response.QuestionOptionResponse;
import com.Kiet.Sun_HSK.entity.QuestionOption;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface OptionMapper {
    QuestionOption toQuestionOption(CreateQuestionOptionRequest createQuestionOptionRequest);
    QuestionOptionResponse toQuestionOptionResponse(QuestionOption questionOption);
    @BeanMapping(
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    void updateQuestionOption(UpdateQuestionOptionRequest request, @MappingTarget QuestionOption questionOption);
}
