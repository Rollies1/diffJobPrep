package com.knust.codequest.questionservice.config;

import com.knust.codequest.questionservice.dto.QuestionDto;
import com.knust.codequest.questionservice.model.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface QuestionMapper {

    @Mapping(target = "categoryName", ignore = true)
    QuestionDto toDto(Question entity);

    List<QuestionDto> toDtoList(List<Question> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Question toEntity(QuestionDto dto);
}
