package com.Kiet.Sun_HSK.mapper;

import com.Kiet.Sun_HSK.dto.request.CreateSectionRequest;
import com.Kiet.Sun_HSK.dto.request.UpdateSectionRequest;
import com.Kiet.Sun_HSK.dto.response.SectionResponse;
import com.Kiet.Sun_HSK.entity.ExamSection;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.springframework.stereotype.Component;

@Mapper(componentModel = "spring")
public interface SectionMapper {
    ExamSection toExamSection(CreateSectionRequest request);
    SectionResponse toSectionResponse(ExamSection examSection);
    @BeanMapping(
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    void updateSection(UpdateSectionRequest request, @MappingTarget ExamSection examSection);
}
